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
