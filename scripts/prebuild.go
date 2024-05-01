//go:build ignore

package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("no argument provided")
		os.Exit(2)
	}

	folderPath := os.Args[1]
	file, err := os.Create(filepath.Join(folderPath, "hello.txt"))
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(2)
	}
	defer file.Close()

	text := []byte("Hello, this is a text file used for the Go embed example!")
	_, err = file.Write(text)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(2)
	}
	fmt.Println("done")
}
