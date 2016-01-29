var url = './pdf/view.pdf';

var pdfDoc = null,
    hasLeadingPage = false,
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
    scale = null,
    scaleShrink = 0.9,
    templateHeightPx = 120,
    browserWidth = window.innerWidth || document.body.clientWidth,
    browserHeight = (window.innerHeight || document.body.clientHeight) - templateHeightPx,
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

    if (isViewDouble) {
        var leftPageNumber = Math.floor(num / 2) * 2;
        var rightPageNumber = leftPageNumber+1;

        if (leftPageNumber > 0) {
            pdfDoc.getPage(leftPageNumber).then(function(page) {
                if ( ! scale) {
                    scale = calculateScaleToFit(page);
                } else {
                    resizeArticleElementToFitPages(page);
                }

                var viewport = page.getViewport(scale);
                leftCanvas.width = viewport.width;
                leftCanvas.height = viewport.height;
                if (rightPageNumber > pdfDoc.numPages) {
                    rightCanvas.width = leftCanvas.width;
                    rightCanvas.height = leftCanvas.height;
                    rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
                    rightCtx.textAlign = 'center';
                    rightCtx.fillText('End of document', rightCanvas.width / 2, rightCanvas.height / 2);
                    var annotationLayerDiv = document.getElementById('right-annotation-layer');
                    while (annotationLayerDiv.firstChild) {
                        annotationLayerDiv.removeChild(annotationLayerDiv.firstChild);
                    }
                }

                var leftRenderTask = page.render({
                    canvasContext: leftCtx, viewport: viewport
                });

                leftRenderTask.promise.then(function () {
                    pageRendering = false;
                    if (pageNumPending !== null) {
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                    setupAnnotations(page, viewport, leftCanvas, document.getElementById('left-annotation-layer'));
                });
            });
        }

        if (rightPageNumber <= pdfDoc.numPages) {
            pdfDoc.getPage(rightPageNumber).then(function(page) {
                if ( ! scale) {
                    scale = calculateScaleToFit(page);
                } else {
                    resizeArticleElementToFitPages(page);
                }

                var viewport = page.getViewport(scale);
                rightCanvas.width = viewport.width;
                rightCanvas.height = viewport.height;

                if (leftPageNumber <= 0) {
                    leftCanvas.width = rightCanvas.width;
                    leftCanvas.height = rightCanvas.height;
                    leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
                    leftCtx.textAlign = 'center';
                    leftCtx.fillText('Start of document', leftCanvas.width / 2, leftCanvas.height / 2);
                    var annotationLayerDiv = document.getElementById('left-annotation-layer');
                    while (annotationLayerDiv.firstChild) {
                        annotationLayerDiv.removeChild(annotationLayerDiv.firstChild);
                    }
                }

                var rightRenderTask = page.render({
                    canvasContext: rightCtx, viewport: viewport
                });

                rightRenderTask.promise.then(function () {
                    pageRendering = false;
                    if (pageNumPending !== null) {
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                    setupAnnotations(page, viewport, rightCanvas, document.getElementById('right-annotation-layer'));
                });
            });
        }
    } else {
        pdfDoc.getPage(num).then(function(page) {
            if ( ! scale) {
                scale = calculateScaleToFit(page);
            } else {
                resizeArticleElementToFitPages(page);
            }
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
                setupAnnotations(page, viewport, canvas, document.getElementById('annotation-layer'));
            });
        });
    }

    document.getElementById('page_num').value = encodePageNumber(pageNum);
    if (favouritePages.indexOf(pageNum) != -1) {
        document.getElementById('favourite').className = 'fa fa-star';
    } else {
        document.getElementById('favourite').className = 'fa fa-star-o';
    }
}

function calculateScaleToFit(page) {
    var fullSizeViewport = page.getViewport(1);
    var scaleWidth = browserWidth / fullSizeViewport.width * scaleShrink;
    var scaleHeight = browserHeight / fullSizeViewport.height * scaleShrink;
    if (scaleWidth < scaleHeight) {
        return scaleWidth;
    }
    return scaleHeight;
}

function resizeArticleElementToFitPages(page) {
    var pagesElement = document.getElementById('pages');
    var viewport = page.getViewport(scale);
    var viewportPaddingMultiplier = 1.1;
    var totalViewportHeight = (viewport.height + templateHeightPx) * viewportPaddingMultiplier;
    if (isViewDouble) {
        var totalViewportWidth = viewport.width * 2 * viewportPaddingMultiplier;
    } else {
        var totalViewportWidth = viewport.width * viewportPaddingMultiplier;
    }

    pagesElement.setAttribute('style', '');
    if (totalViewportWidth > browserWidth) {
        pagesElement.setAttribute('style', 'width: ' + totalViewportWidth + 'px;');
        pagesElement.style.width = totalViewportWidth + 'px';
    } else {
        pagesElement.setAttribute('style', 'width: 100%');
        pagesElement.style.width = '100%';
    }

    if (totalViewportHeight > (browserHeight + templateHeightPx)) {
        pagesElement.setAttribute('style', pagesElement.getAttribute('style') + 'height: ' + totalViewportHeight +  + 'px;');
        pagesElement.style.height = totalViewportHeight + 'px';
    } else {
        pagesElement.setAttribute('style', 'height: 100vh');
        pagesElement.style.height = '100vh';
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
    if (isViewDouble) {
        pageNum -= 2;
    } else {
        pageNum--;
    }
    queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    if (isViewDouble) {
        pageNum += 2;
    } else {
        pageNum++;
    }
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
        window.open('./pdf/' + downloadFile, '_self')
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
        return parseInt(number) + 2;
    }
}

function encodePageNumber(number) {
    if (number == 1) {
        return 'i';
    } else if (number == 2) {
        return 'ii';
    } else {
        return parseInt(number) - 2;
    }
}

function encodePageTotal(number) {
    return number - 2;
}

function setupAnnotations(page, viewport, canvas, annotationLayerDiv) {
    while (annotationLayerDiv.firstChild) {
        annotationLayerDiv.removeChild(annotationLayerDiv.firstChild);
    }

    var canvasBoundingRect = canvas.getBoundingClientRect();
    var canvasOffset = {
      top: canvasBoundingRect.top + document.body.scrollTop,
      left: canvasBoundingRect.left + document.body.scrollLeft
    }
    var promise = page.getAnnotations().then(function (annotationsData) {
        viewport = viewport.clone({
            dontFlip: true
        });

        for (var i = 0; i < annotationsData.length; i++) {
            var data = annotationsData[i];
            if ( ! data || ! data.hasHtml) {
                continue;
            }

            var element = document.createElement('a');
            var rect = data.rect;
            var view = page.view;
            rect = PDFJS.Util.normalizeRect([
                rect[0],
                view[3] - rect[1] + view[1],
                rect[2],
                view[3] - rect[3] + view[1]]);
            element.style.left = (canvasOffset.left + rect[0]) + 'px';
            element.style.top = (canvasOffset.top + rect[1]) + 'px';
            element.style.position = 'absolute';
            element.style.width = parseInt(rect[2] - rect[0]) + 'px';
            element.style.height = parseInt(rect[3] - rect[1]) + 'px';
            element.style.cursor = 'pointer';

            var transform = viewport.transform;
            var transformStr = 'matrix(' + transform.join(',') + ')';
            PDFJS.CustomStyle.setProp('transform', element, transformStr);
            var transformOriginStr = -rect[0] + 'px ' + -rect[1] + 'px';
            PDFJS.CustomStyle.setProp('transformOrigin', element, transformOriginStr);

            if (data.subtype === 'Link' && data.url) {
                element.setAttribute('href', data.url);
            } else {
                pdfDoc.getDestination(data.dest).then(function(destination) {
                    pdfDoc.getPageIndex(destination[0]).then(function(pageIndex) {
                        element.addEventListener('click', function() {
                            pageNum = pageIndex + 1;
                            queueRenderPage(pageNum);
                        });
                    });
                });
            }
            annotationLayerDiv.appendChild(element);
        }
    });
    return promise;
}

PDFJS.getDocument(url).then(function (pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = encodePageTotal(pdfDoc.numPages);
    renderPage(pageNum);

    for (var i = 0; i < pdfDoc.numPages; i++) {
        var li = document.createElement('li');
        li.innerHTML = document.getElementById('thumbnails-template').innerHTML
            .replace(/{{page_name}}/g, String(encodePageNumber(i+1)))
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
