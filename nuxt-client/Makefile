build:
	docker build -t iberdinsky/actions-ui .

run:
	docker run --rm -it -p 3000:3000 -v ${PWD}:/usr/src/nuxt-app/actions/ iberdinsky/actions-ui


# git clone https://github.com/iberdinsky-skilld/launchr.git
#	cd launchr
# git co ui-schemes
# cd example/ui-schemes
# docker run --rm -it -p 3000:3000 -v ${PWD}:/usr/src/nuxt-app/actions/ iberdinsky/actions-ui
# you will see something like https://silly-cat-5303aa.netlify.app/


bb:
	docker build -t iberdinsky/actions-ui-backend ./backend

bb_run:
	# docker run --rm -it -v ${PWD}:/usr/src/app -p 8080:8080  iberdinsky/actions-ui-backend
	docker run --rm -it -p 8080:8080 -v ${PWD}:/usr/src/app/actions -v /var/run/docker.sock:/var/run/docker.sock iberdinsky/actions-ui-backend