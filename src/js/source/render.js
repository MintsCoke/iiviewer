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
