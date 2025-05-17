document.addEventListener('DOMContentLoaded', function() {
    // Check if the plugin is freshly installed
    chrome.storage.sync.get({ isFreshInstall: true }, function(data) {
        if (data.isFreshInstall) {
            // Bootstrap the sites from sitePromptMap
            var sites = [];
            for (var domain in sitePromptMap) {
                if (sitePromptMap.hasOwnProperty(domain)) {
                    sites.push({
                        domain: domain,
                        rolePrompt: sitePromptMap[domain]
                    });
                }
            }
            chrome.storage.sync.set({ sites: sites, isFreshInstall: false }, function() {
                loadSites();
            });
        } else {
            loadSites();
        }
    });

    document.getElementById('addSite').addEventListener('click', addSite);
});

const sitePromptMap = {
  "stackoverflow.com": "You are a senior software engineer answering technical coding questions with concise, accurate solutions. Reference relevant code and best practices.",
  "github.com": "You are a GitHub code reviewer. Provide clear, constructive, and concise code analysis and suggestions.",
  "wikipedia.org": "You are an academic researcher summarizing and clarifying historical or scientific facts with neutrality and citations if needed.",
  "medium.com": "You are a writing assistant summarizing and analyzing blog posts with insights, highlights, and takeaways.",
  "youtube.com": "You are a video content summarizer. Help describe or summarize what this video is about, based on the title and surrounding text.",
  "amazon.com": "You are an e-commerce analyst. Summarize product features, compare alternatives, and highlight key purchase considerations.",
  // Add more as needed...
};

function addSite() {
    var domain = document.getElementById('domain').value;
    var rolePrompt = document.getElementById('rolePrompt').value;

    if (!domain || !rolePrompt) {
        var status = document.getElementById('status');
        status.textContent = 'Domain and Role Prompt cannot be empty.';
        return;
    }

    chrome.storage.sync.get({ sites: [] }, function(data) {
        var sites = data.sites;
        var existingSiteIndex = sites.findIndex(function(site) {
            return site.domain === domain;
        });

        if (existingSiteIndex !== -1) {
            // Site already exists, ask for confirmation to override
            if (confirm('Site already exists. Do you want to override it?')) {
                sites[existingSiteIndex] = {
                    domain: domain,
                    rolePrompt: rolePrompt
                };
                saveSites(sites, 'Site updated successfully.');
            } else {
                // User cancelled the override
                var status = document.getElementById('status');
                status.textContent = 'Update cancelled.';
                setTimeout(function() {
                    status.textContent = '';
                }, 2000);
            }
        } else {
            // Site doesn't exist, add it to the list
            var newSite = {
                domain: domain,
                rolePrompt: rolePrompt
            };
            sites.push(newSite);
            saveSites(sites, 'Site added successfully.');
        }
    });
}

function saveSites(sites, message) {
    chrome.storage.sync.set({ sites: sites }, function() {
        loadSites();
        // Clear the input fields
        document.getElementById('domain').value = '';
        document.getElementById('rolePrompt').value = '';

        var status = document.getElementById('status');
        status.textContent = message;
        setTimeout(function() {
            status.textContent = '';
        }, 2000);
    });
}

function loadSites() {
    var siteList = document.getElementById('siteList');
    siteList.innerHTML = ''; // Clear the list

    chrome.storage.sync.get({ sites: [] }, function(data) {
        var sites = data.sites;

        sites.forEach(function(site) {
            var li = document.createElement('li');
            li.textContent = site.domain + ' - ' + site.rolePrompt;

            var deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', function() {
                deleteSite(site);
            });

            li.appendChild(deleteButton);
            siteList.appendChild(li);
        });
    });
}

function deleteSite(siteToDelete) {
    chrome.storage.sync.get({ sites: [] }, function(data) {
        var sites = data.sites;
        var updatedSites = sites.filter(function(site) {
            return site.domain !== siteToDelete.domain;
        });

        chrome.storage.sync.set({ sites: updatedSites }, function() {
            loadSites();
        });
    });
}
