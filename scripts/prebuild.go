//go:build ignore

package main

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func handleErr(err error) {
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
}

var (
	tplDistPath = "https://github.com/launchrctl/web/releases/download/%s/dist.tar.gz"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("not enough arguments provided")
		os.Exit(2)
	}

	release := os.Args[1]
	dirPath := os.Args[2]

	archivePath := filepath.Clean(filepath.Join(dirPath, "dist.tar.gz"))
	resultPath := filepath.Clean(filepath.Join(dirPath, "."))

	fmt.Println("Trying to download dist archive...")

	downloadURL := fmt.Sprintf(tplDistPath, release)
	err := downloadFile(downloadURL, archivePath)
	handleErr(err)

	fmt.Println("Trying to unarchive dist archive...")
	err = untar(archivePath, resultPath)
	handleErr(err)

	fmt.Println("Removing tar file")
	err = os.Remove(archivePath)
	handleErr(err)

	fmt.Println("Success")
}

func downloadFile(url string, filePath string) error {
	// Create the file
	out, err := os.Create(filepath.Clean(filePath))
	if err != nil {
		return err
	}
	defer out.Close()

	// Download the body
	client := &http.Client{}
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	resp, err := client.Do(req)
	if err != nil {
		resp.Body.Close() //nolint
		return err
	}
	defer resp.Body.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	return err
}

func untar(fpath, tpath string) error {
	r, errOp := os.Open(filepath.Clean(fpath))
	if errOp != nil {
		return errOp
	}

	gzr, errRead := gzip.NewReader(r)
	if errRead != nil {
		return errRead
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)

	for {
		header, err := tr.Next()

		switch {

		// if no more files are found return
		case err == io.EOF:

			return nil

		// return any other error
		case err != nil:
			return err

		// if the header is nil, just skip it (not sure how this happens)
		case header == nil:
			continue
		}

		// the target location where the dir/file should be created
		target, err := sanitizeArchivePath(tpath, header.Name)
		if err != nil {
			return errors.New("invalid filepath")
		}

		if !strings.HasPrefix(target, filepath.Clean(tpath)) {
			return errors.New("invalid filepath")
		}

		// check the file type
		switch header.Typeflag {

		// if it's a dir, and it doesn't exist create it
		case tar.TypeDir:
			if _, err := os.Stat(target); err != nil {
				if err := os.MkdirAll(target, 0750); err != nil {
					return err
				}
			}

		// if it's a file create it
		case tar.TypeReg:
			f, err := os.OpenFile(filepath.Clean(target), os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				return err
			}

			for {
				_, err = io.CopyN(f, tr, 1024)
				if err != nil {
					if err != io.EOF {
						return err
					}
					break
				}
			}

			// manually close here after each file operation; deferring would cause each file close
			// to wait until all operations have completed.
			err = f.Close()
			if err != nil {
				return err
			}
		}
	}
}

func sanitizeArchivePath(d, t string) (v string, err error) {
	v = filepath.Join(d, t)
	if strings.HasPrefix(v, filepath.Clean(d)) {
		return v, nil
	}

	return "", fmt.Errorf("%s: %s", "content filepath is tainted", t)
}
