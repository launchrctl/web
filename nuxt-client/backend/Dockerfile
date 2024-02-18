# Use the Go Alpine image as the base image
FROM golang:alpine as builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install build dependencies (such as make) if needed
RUN apk --no-cache add git make

# Clone the launchr repository
RUN git clone https://github.com/launchrctl/launchr .

# Build the Go application using the Makefile
RUN make install

FROM golang:alpine as runner

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/bin ./bin

# Copy the source code
COPY ./main.go .

RUN go mod init iberdinsky/actions-ui-backend

# Install gorilla/mux
RUN go get -u github.com/gorilla/mux

RUN apk update && apk add --no-cache docker-cli

# Expose the port your application will run on
EXPOSE 8080

# Define the command to run your application
CMD ["go", "run", "main.go"]
