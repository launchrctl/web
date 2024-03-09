// main.go
package main

import (
	"fmt"
	"net/http"
	"os/exec"
	"github.com/gorilla/mux"
)

func main() {
	// Create a new router
	r := mux.NewRouter()

	// Define API endpoints
	r.HandleFunc("/api/launchr", launchrHandler).Methods("GET")

	// Start the HTTP server
	http.Handle("/", r)
	fmt.Println("Server listening on :8080...")
	http.ListenAndServe(":8080", nil)
}

func launchrHandler(w http.ResponseWriter, r *http.Request) {
	// Run the CLI command
	if err := runCLICommand(w); err != nil {
		fmt.Fprintln(w, "Error running CLI command:", err)
		return
	}

	fmt.Fprintln(w, "Hello, World!")
}

func runCLICommand(w http.ResponseWriter) error {
	// Replace "your_command" with the actual CLI command you want to run
	cmd := exec.Command("./bin/launchr", "actions.content:cowsay", "Hello from action")

	// Redirect command output to standard output and error
	cmd.Stdout = w
	cmd.Stderr = w

	// Run the command
	return cmd.Run()
}
