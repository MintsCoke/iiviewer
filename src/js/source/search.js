function onSearchView() {
    var searchItems = document.getElementsByClassName('search-item');
    for (var i = 0; i < searchItems.length; i++) {
        searchItems[i].removeAttribute('id');
    }
    this.id = 'search-item-current';
}

function onSearchFind() {
    var searchResultsElement = document.getElementById('search-results');
    while (searchResultsElement.firstChild) {
        searchResultsElement.removeChild(searchResultsElement.firstChild);
    }
    var client = new XMLHttpRequest();
    client.open('GET', './pdf/search.txt');
    client.onreadystatechange = function() {
        var DONE = 4;
        if (client.readyState !== DONE || client.status !== 200) {
            return;
        }
        var lines = client.responseText.split('\n');
        var searchPage = 1;
        var searchResults = [];
        var searchQuery = document.getElementById('search-query').value.toLowerCase();
        ga('set', 'page', '/search-' + searchQuery);
        ga('send', 'pageview');
        if ( ! searchQuery) {
            return;
        }
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].indexOf('NEWPAGE') == 0) {
                searchPage++;
                continue;
            }
            var searchQueryIndex = lines[i].toLowerCase().indexOf(searchQuery);
            if (searchQueryIndex < 0) {
                continue;
            }
            if (i == 0) {
                var previousLine = '';
            } else {
                var previousLine = lines[i-1];
            }

            if (i == lines.length - 1) {
                var nextLine = '';
            } else {
                var nextLine = lines[i+1];
            }

            var searchHighlightBegin = '<span class="search-highlight">';
            var searchHighlightEnd = '</span>';
            var currentLine = lines[i].slice(0, searchQueryIndex)
                + searchHighlightBegin
                + lines[i].slice(searchQueryIndex, searchQueryIndex+searchQuery.length)
                + searchHighlightEnd
                + lines[i].slice(searchQueryIndex+searchQuery.length);
            var searchContext = previousLine + ' ' + currentLine + ' ' + nextLine;
            var searchSnippetBeginIndex = previousLine.length + searchQueryIndex - 10;
            if (searchSnippetBeginIndex < 0) {
                searchSnippetBeginIndex = 0;
            }
            var searchSnippetEndIndex = previousLine.length + searchQueryIndex + searchHighlightBegin.length + searchQuery.length + searchHighlightEnd.length + 1 + 10;
            if (searchSnippetEndIndex > searchContext.length) {
                searchSnippetEndIndex = searchContext.length;
            }
            var searchSnippet = '...' + searchContext.slice(searchSnippetBeginIndex, searchSnippetEndIndex) + '...';

            searchResults.push({
                pageNumber: searchPage,
                snippet: searchSnippet,
                thumbnailFile: 'thumbnail-' + String(searchPage-1) + '.png'
            });
        }

        for (var i = 0; i < searchResults.length; i++) {
            var searchResult = searchResults[i];
            var li = document.createElement('li');
            li.innerHTML = document.getElementById('search-result-template').innerHTML
                .replace(/{{page_number}}/g, searchResult.pageNumber)
                .replace(/{{thumbnail_file}}/g, searchResult.thumbnailFile)
                .replace(/{{snippet}}/g, searchResult.snippet);
            li.className = 'search-item';
            li.dataset.pageNumber = searchResult.pageNumber;
            document.getElementById('search-results').appendChild(li);
            li.children[0].addEventListener('click', onViewPage);
            li.addEventListener('click', onSearchView);
        }
    }
    client.send();
}
document.getElementById('search-find').addEventListener('click', onSearchFind);

function onSearchNext() {
    var searchItemCurrent = document.getElementById('search-item-current');
    if (searchItemCurrent) {
        if (searchItemCurrent.nextSibling) {
            searchItemCurrent.nextSibling.click();
            searchItemCurrent.nextSibling.children[0].click();
        }
    } else {
        var searchResultsElement = document.getElementById('search-results');
        if (searchResultsElement.firstChild) {
            searchResultsElement.firstChild.click();
            searchResultsElement.firstChild.children[0].click();
        }
    }
}
document.getElementById('search-next').addEventListener('click', onSearchNext);

function onSearchPrev() {
    var searchItemCurrent = document.getElementById('search-item-current');
    if (searchItemCurrent) {
        if (searchItemCurrent.previousSibling) {
            searchItemCurrent.previousSibling.click();
            searchItemCurrent.previousSibling.children[0].click();
        }
    } else {
        var searchResultsElement = document.getElementById('search-results');
        if (searchResultsElement.firstChild) {
            searchResultsElement.firstChild.click();
            searchResultsElement.firstChild.children[0].click();
        }
    }
}
document.getElementById('search-prev').addEventListener('click', onSearchPrev);

document.getElementById('search-query').onkeypress = function(event) {
    if ( ! event) event = window.event;
    var keyCode = event.keyCode || event.which;
    var enterKeyCode = '13';
    if (keyCode == enterKeyCode) {
        onSearchFind();
    }
};
