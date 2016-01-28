var url = './pdf/view.pdf';

var pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        isViewDouble = false,
        isViewContents = false,
        isViewSearch = false,
        isViewDownload = false,
        isViewShare = false,
        isViewList = false,
        favouritePages = [],
        checkedSectionsNum = 0,
        scale = 0.8,
        canvas = document.getElementById('single-canvas'),
        ctx = canvas.getContext('2d'),
        leftCanvas = document.getElementById('left-canvas'),
        leftCtx = leftCanvas.getContext('2d'),
        rightCanvas = document.getElementById('right-canvas'),
        rightCtx = rightCanvas.getContext('2d');

function renderPage(num) {
    ga('set', 'page', '/view-page-' + num);
    ga('send', 'pageview');
    pageRendering = true;
    pdfDoc.getPage(num).then(function(page) {
        if (isViewDouble) {
            var viewport = page.getViewport(scale);
            leftCanvas.height = viewport.height;
            leftCanvas.width = viewport.width;

            var leftRenderTask = page.render({
                canvasContext: leftCtx, viewport: viewport
            });

            leftRenderTask.promise.then(function () {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });

            if (num+1 > pdfDoc.numPages) {
                rightCanvas.height = leftCanvas.height;
                rightCanvas.width = leftCanvas.width;
                rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
                rightCtx.textAlign = 'center';
                rightCtx.fillText('End of document', rightCanvas.width / 2, rightCanvas.height / 2);
            } else {
                pdfDoc.getPage(num+1).then(function(page) {
                    rightCanvas.height = viewport.height;
                    rightCanvas.width = viewport.width;

                    var rightRenderTask = page.render({
                        canvasContext: rightCtx, viewport: viewport
                    });

                    rightRenderTask.promise.then(function () {
                        pageRendering = false;
                        if (pageNumPending !== null) {
                            renderPage(pageNumPending);
                            pageNumPending = null;
                        }
                    });
                });
            }
        } else {
            var viewport = page.getViewport(scale);
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);

            renderTask.promise.then(function () {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        }
    });

    document.getElementById('page_num').value = encodePageNumber(pageNum);
    if (favouritePages.indexOf(pageNum) != -1) {
        document.getElementById('favourite').className = 'fa fa-star';
    } else {
        document.getElementById('favourite').className = 'fa fa-star-o';
    }
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);

function onFirstPage() {
    if (pageNum == 1) {
        return;
    }
    pageNum = 1;
    queueRenderPage(pageNum);
}
document.getElementById('first').addEventListener('click', onFirstPage);

function onLastPage() {
    if (pageNum == pdfDoc.numPages) {
        return;
    }
    pageNum = pdfDoc.numPages;
    queueRenderPage(pageNum);
}
document.getElementById('last').addEventListener('click', onLastPage);

function onChangePage() {
    var changePageNum = parseInt(decodePageNumber(document.getElementById('page_num').value));
    if (changePageNum <= 1) {
        return onFirstPage();
    } else if (changePageNum >= pdfDoc.numPages) {
        return onLastPage();
    }
    pageNum = changePageNum;
    queueRenderPage(pageNum);
}
document.getElementById('page_num').addEventListener('change', onChangePage);

function onZoomIn() {
    scale += 0.1;
    queueRenderPage(pageNum);
}
document.getElementById('zoom-in').addEventListener('click', onZoomIn);

function onZoomOut() {
    scale -= 0.1;
    queueRenderPage(pageNum);
}
document.getElementById('zoom-out').addEventListener('click', onZoomOut);

function onViewDouble() {
    if (isViewDouble) {
        return;
    }
    document.getElementById('single-page').style.display = 'none';
    document.getElementById('double-page').style.display = 'table-cell';
    scale *= 0.5;
    isViewDouble = true;
    queueRenderPage(pageNum);
}
document.getElementById('view-double').addEventListener('click', onViewDouble);

function onViewSingle() {
    if ( ! isViewDouble) {
        return;
    }
    document.getElementById('single-page').style.display = 'table-cell';
    document.getElementById('double-page').style.display = 'none';
    scale *= 2;
    isViewDouble = false;
    queueRenderPage(pageNum);
}
document.getElementById('view-single').addEventListener('click', onViewSingle);

function onViewContents() {
    if (isViewContents) {
        document.getElementById('contents').style.display = 'none';
    } else {
        document.getElementById('contents').style.display = 'block';
    }
    isViewContents = ! isViewContents;
}
document.getElementById('view-contents').addEventListener('click', onViewContents);

function onViewSearch() {
    toggleRightPanel('search');
}
document.getElementById('view-search').addEventListener('click', onViewSearch);


function onViewPage(event) {
    var clickedPage = parseInt(this.dataset.pageNumber);
    if (pageNum == clickedPage) {
        return;
    }
    pageNum = clickedPage;
    queueRenderPage(pageNum);
}

function onViewList() {
    if (isViewList) {
        return;
    }
    document.getElementById('contents-list').style.display = 'block';
    document.getElementById('contents-thumbnail').style.display = 'none';
    document.getElementById('contents-title').innerHTML = document.getElementById('contents-title').dataset.listTitle;
    isViewList = true;
}
document.getElementById('view-list').addEventListener('click', onViewList);

function onViewThumbnail() {
    if ( ! isViewList) {
        return;
    }
    document.getElementById('contents-list').style.display = 'none';
    document.getElementById('contents-thumbnail').style.display = 'block';
    document.getElementById('contents-title').innerHTML = document.getElementById('contents-title').dataset.thumbnailTitle;
    isViewList = false;
}
document.getElementById('view-thumbnail').addEventListener('click', onViewThumbnail);

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

function onViewDownload() {
    toggleRightPanel('download');
}
document.getElementById('view-download').addEventListener('click', onViewDownload);

function onViewShare() {
    toggleRightPanel('share');
}
document.getElementById('view-share').addEventListener('click', onViewShare);

function onFavourite() {
    var favouritePageIndex = favouritePages.indexOf(pageNum)
    if (favouritePageIndex == -1) {
        favouritePages.push(pageNum);
        document.getElementById('favourite').className = 'fa fa-star';
    } else {
        favouritePages.splice(favouritePageIndex, 1);
        document.getElementById('favourite').className = 'fa fa-star-o';
    }
    document.getElementById('favourite-number').textContent = String(favouritePages.length);
}
document.getElementById('favourite').addEventListener('click', onFavourite);

function downloadPages(pages) {
    var client = new XMLHttpRequest();
    client.open('GET', 'compile.php?pages=' + pages);
    client.onreadystatechange = function() {
        var DONE = 4;
        if (client.readyState !== DONE || client.status !== 200) {
            return;
        }
        var downloadFile = client.responseText;
        ga('set', 'page', '/download-' + pages);
        ga('send', 'pageview');
        window.open('./pdf/' + downloadFile)
    }
    client.send();
}

function onDownloadFavourite() {
    downloadPages(favouritePages.join());
}
document.getElementById('download-favourite').addEventListener('click', onDownloadFavourite);

function onDownloadSection() {
    var downloadSectionElements = document.getElementsByClassName('download-section');
    var pages = '';
    for (var i = 0; i < downloadSectionElements.length; i++) {
        if (downloadSectionElements[i].checked) {
            pages += downloadSectionElements[i].value;
        }
    }
    downloadPages(pages);
}
document.getElementById('download-section').addEventListener('click', onDownloadSection);

function onDownloadSectionCheck() {
    if (this.checked) {
        document.getElementById('section-number').textContent = String(parseInt(document.getElementById('section-number').textContent)+1);
    } else {
        document.getElementById('section-number').textContent = String(parseInt(document.getElementById('section-number').textContent)-1);
    }
}

function toggleRightPanel(name) {
    document.getElementById('search').style.display = 'none';
    document.getElementById('download').style.display = 'none';
    document.getElementById('share').style.display = 'none';
    if (name === 'search') {
        isViewSearch = ! isViewSearch;
        isViewDownload = false;
        isViewShare = false;
        if (isViewSearch) {
            document.getElementById('search').style.display = 'block';
        }
    } else if (name === 'download') {
        isViewSearch = false;
        isViewDownload = ! isViewDownload;
        isViewShare = false;
        if (isViewDownload) {
            document.getElementById('download').style.display = 'block';
        }
    } else if (name === 'share') {
        isViewSearch = false;
        isViewDownload = false;
        isViewShare = ! isViewShare;
        if (isViewShare) {
            document.getElementById('share').style.display = 'block';
        }
    }
}

function decodePageNumber(number) {
    if (number == 'i') {
        return 1;
    } else if (number == 'ii') {
        return 2;
    } else {
        return number + 2;
    }
}

function encodePageNumber(number) {
    if (number == 1) {
        return 'i';
    } else if (number == 2) {
        return 'ii';
    } else {
        return number - 2;
    }
}

function encodePageTotal(number) {
    return number - 2;
}


PDFJS.getDocument(url).then(function (pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = encodePageTotal(pdfDoc.numPages);
    renderPage(pageNum);

    for (var i = 0; i < pdfDoc.numPages; i++) {
        var li = document.createElement('li');
        li.innerHTML = document.getElementById('thumbnails-template').innerHTML
            .replace(/{{page_number}}/g, String(i+1))
            .replace('{{thumbnail_file}}', 'thumbnail-' + String(i) + '.png');
        document.getElementById('thumbnails').appendChild(li);
    }

    var viewPageElements = document.getElementsByClassName('view-page');
    for (var i = 0; i < viewPageElements.length; i++) {
        viewPageElements[i].addEventListener('click', onViewPage);
    }

    var downloadSectionElements = document.getElementsByClassName('download-section');
    for (var i = 0; i < downloadSectionElements.length; i++) {
        downloadSectionElements[i].addEventListener('click', onDownloadSectionCheck);
    }
});

Tooltip({
    showDelay: 10,
    offset: { x: 0, y: 5 }
});
