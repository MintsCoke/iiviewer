.PHONY : default
default : ;

.PHONY : develop
develop :
	cd src && npm install
	cd src/node_modules/modernizr && ./bin/modernizr -c ./lib/config-all.json
	cd src && gulp

.PHONY : pdf
pdf :
	cd src/pdf && gs -sDEVICE=png16m -dTextAlphaBits=4 -r75 -o thumbnail-%d.png view.pdf
	cd src/pdf && mogrify -resize 250x250 *.png
	cd src/pdf && pdftotext view.pdf
	cd src/pdf && awk '/^\014/{sub("\014","NEWPAGE\n")}1' view.txt > search.txt
	cd src/pdf && rm view.txt
