<?php

$pages = explode(',', $_GET['pages']);

foreach ($pages as $key => $page)
{
    $pages[$key] = (int) $page;
    if ($pages[$key] === 0)
    {
        unset($pages[$key]);
    }
}

if (count($pages) === 0)
    die();

sort($pages);

$output_filename = round(microtime(TRUE) * 1000).'.pdf';
exec('pdftk pdf/view.pdf cat '.implode(' ', $pages).' output '.escapeshellarg('pdf/'.$output_filename));
echo $output_filename;
die();
