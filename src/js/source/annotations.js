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
