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
