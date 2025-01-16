package web

import (
	"archive/tar"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/launchrctl/launchr"
)

const (
	versionLatest = "latest"
	repoName      = "launchrctl/web"

	// PkgPath is the plugin module name.
	PkgPath = "github.com/" + repoName
)

// Generate implements [launchr.GeneratePlugin] interface.
func (p *Plugin) Generate(config launchr.GenerateConfig) error {
	launchr.Term().Info().Printfln("Preparing %s plugin assets...", repoName)

	// Download web client assets.
	subdir := "web-plugin"
	webPath := filepath.Join(config.BuildDir, subdir)
	v := getPluginVersion()
	launchr.Log().Debug("web plugin version used in go.mod", "version", v)
	err := downloadGithubRelease(webPath, repoName, v)
	if err != nil {
		return err
	}

	// Prepare the generated plugin with embed assets.
	launchr.Term().Info().Println("Generating web client embed assets go file")
	type templateVars struct {
		Pkg         string
		ClientPath  string
		SwaggerPath string
	}
	tpl := launchr.Template{Tmpl: pluginTemplate, Data: templateVars{
		Pkg:        PkgPath,
		ClientPath: subdir,
	}}
	err = tpl.WriteFile(filepath.Join(config.BuildDir, "web_assets.gen.go"))
	if err != nil {
		return err
	}

	return nil
}

func downloadGithubRelease(dir string, project string, version string) error {
	// Get release url and download the tarball.
	releaseURL, err := getGithubReleaseDownloadURL(project, version)
	if err != nil {
		return err
	}
	if releaseURL == "" {
		return fmt.Errorf("gen: failed to get release url for %s %s", project, version)
	}
	launchr.Log().Debug("get github release archive stream", "url", releaseURL)
	gzippedStream, err := getFileStreamByURL(releaseURL)
	if err != nil {
		return err
	}
	defer gzippedStream.Close()

	// Unarchive the release.
	launchr.Log().Debug("unarchiving archive from stream", "dir", dir)
	err = untar(gzippedStream, untarOptions{
		Destination: dir,
		Gzip:        true,
	})
	if err != nil {
		return err
	}

	return nil
}

func getPluginVersion() string {
	version := launchr.Version()
	branchRelease := regexp.MustCompile(`-0\..*$`)
	for _, dep := range version.Plugins {
		if strings.HasPrefix(dep, PkgPath+" ") {
			// Get version from the string.
			i := strings.IndexRune(dep, ' ')
			if i == -1 {
				panic("incorrect plugin version")
			}
			v := dep[i+1:]
			// 1. Branch releases referenced like `go get repo_url@branch-name` have a version string
			// like `v0.1.2-0.[date]-[commit-hash]`. We don't have artifacts for that, don't break and use latest.
			// 2. During the development inside the repository, go mod returns (devel).
			if len(v) == 0 || v == "(devel)" || branchRelease.MatchString(v) {
				return versionLatest
			}
			return v
		}
	}
	return versionLatest
}

func getGithubReleaseDownloadURL(repo, version string) (string, error) {
	if version != versionLatest {
		version = "tags/" + version
	}
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/releases/%s", repo, version)
	// Get release information.
	releaseResp, err := http.Get(apiURL) //nolint G107 // The link is generated above.
	if err != nil {
		return "", err
	}
	// Parse release JSON.
	defer releaseResp.Body.Close()
	if releaseResp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gen: failed to fetch %s (%d)", apiURL, releaseResp.StatusCode)
	}
	body, err := io.ReadAll(releaseResp.Body)
	if err != nil {
		return "", err
	}
	type GithubAPIResponse struct {
		Assets []struct {
			Name        string `json:"name"`
			DownloadURL string `json:"browser_download_url"`
		}
		TarballURL string `json:"tarball_url"`
	}
	var parsedResp GithubAPIResponse
	err = json.Unmarshal(body, &parsedResp)
	if err != nil {
		return "", err
	}
	for _, asset := range parsedResp.Assets {
		if strings.HasSuffix(asset.Name, "tar.gz") {
			return asset.DownloadURL, nil
		}
	}
	return parsedResp.TarballURL, nil
}

func getFileStreamByURL(url string) (io.ReadCloser, error) {
	resp, err := http.Get(url) //nolint G107 // The link is generated above.
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gen: could not download from the url %s", url)
	}

	// Return the body of the file.
	return resp.Body, err
}

type untarOptions struct {
	Destination string
	PathGlob    string
	Strip       int
	Gzip        bool
}

func (u untarOptions) matchPath(p string) bool {
	if u.PathGlob == "" {
		return true
	}
	match, err := filepath.Match(u.PathGlob, p)
	if err != nil {
		// Incorrect pattern.
		panic(err)
	}
	return match
}

func untar(r io.ReadCloser, opts untarOptions) error {
	destDir := filepath.Clean(opts.Destination)
	var tr *tar.Reader
	if opts.Gzip {
		gzr, errRead := gzip.NewReader(r)
		if errRead != nil {
			return errRead
		}
		defer gzr.Close()
		tr = tar.NewReader(gzr)
	} else {
		tr = tar.NewReader(r)
	}

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
		// skip unwanted path
		case !opts.matchPath(header.Name):
			continue
		}

		// the target location where the dir/file should be created
		target, err := sanitizeArchivePath(destDir, header.Name, opts.Strip)
		if err != nil || !strings.HasPrefix(target, destDir) {
			return errors.New("invalid filepath")
		}

		// check the file type
		switch header.Typeflag {
		// if it's a dir, and it doesn't exist create it
		case tar.TypeDir:
			if _, err = os.Stat(target); err != nil {
				if err = os.MkdirAll(target, 0750); err != nil {
					return err
				}
			}
		// if it's a file create it
		case tar.TypeReg:
			var f *os.File
			filemode := os.FileMode(header.Mode)                          //nolint 115 // Overflow should never happen
			f, err = os.OpenFile(target, os.O_CREATE|os.O_RDWR, filemode) //nolint 304 // Path is clean.
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

func sanitizeArchivePath(base string, target string, strip int) (v string, err error) {
	if strip > 0 {
		parts := strings.Split(target, string(filepath.Separator))
		target = strings.Join(parts[strip:], string(filepath.Separator))
	}
	v = filepath.Clean(filepath.Join(base, target))
	if strings.HasPrefix(v, base) {
		return v, nil
	}

	return "", fmt.Errorf("content filepath is tainted: %s", target)
}

const pluginTemplate = `// Code generated by {{.Pkg}}. DO NOT EDIT.
package main

import (
	"embed"

	web "{{.Pkg}}"
)

//go:embed {{.ClientPath}}/*
var webClientFS embed.FS

func init() {
	web.SetClientAssetsFS(web.MustSubFS(webClientFS, "{{.ClientPath}}"))
}
`
