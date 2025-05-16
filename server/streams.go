package server

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"
)

type fileStreams interface {
	GetStreamData(GetRunningActionStreamsParams) ([]*ActionRunStreamData, error)
}

// webCli implements Streams interface.
type webCli struct {
	launchr.Streams
	files []*os.File
}

// Close implements io.Closer.
func (cli *webCli) Close() (err error) {
	return cli.Streams.Close()
}

// GetStreamData implements fileStreams.
func (cli *webCli) GetStreamData(_ GetRunningActionStreamsParams) ([]*ActionRunStreamData, error) {
	// @todo include GetRunningActionStreamsParams
	_, err := cli.files[0].Seek(0, io.SeekStart)
	if err != nil {
		return nil, err
	}
	reader := bufio.NewReader(cli.files[0])
	outData, err := io.ReadAll(reader)
	if err != nil {
		return nil, err
	}

	outSd := &ActionRunStreamData{
		Type:    StdOut,
		Content: string(outData),
	}

	_, err = cli.files[1].Seek(0, io.SeekStart)
	if err != nil {
		return nil, err
	}
	reader = bufio.NewReader(cli.files[1])
	errData, err := io.ReadAll(reader)
	if err != nil {
		return nil, err
	}

	errSd := &ActionRunStreamData{
		Type:    StdErr,
		Content: string(errData),
	}

	result := []*ActionRunStreamData{outSd, errSd}
	return result, nil
}

type wrappedWriter struct {
	p ActionRunStreamDataType
	w io.Writer
}

func (w *wrappedWriter) Write(p []byte) (int, error) {
	return w.w.Write(p)
}

func (w *wrappedWriter) Close() error {
	if c, ok := w.w.(io.Closer); ok {
		return c.Close()
	}
	return nil
}

func createFileStreams(streamsDir, runId string, app launchr.App, quiet bool) (*webCli, error) {
	outfile, err := os.Create(filepath.Join(streamsDir, runId+"-out.txt"))
	if err != nil {
		return nil, fmt.Errorf("error creating output file: %w", err)
	}

	errfile, err := os.Create(filepath.Join(streamsDir, runId+"-err.txt"))
	if err != nil {
		return nil, fmt.Errorf("error creating error file: %w", err)
	}

	// Create wrapped writers
	out := &wrappedWriter{
		p: StdOut,
		w: outfile,
	}
	errWriter := &wrappedWriter{
		p: StdErr,
		w: errfile,
	}

	if quiet {
		out.w = io.Discard
		errWriter.w = io.Discard
	}

	// Build and return webCli
	return &webCli{
		Streams: launchr.NewBasicStreams(nil, app.SensitiveWriter(out), app.SensitiveWriter(errWriter)),
		files:   []*os.File{outfile, errfile},
	}, nil
}

func isQuietModeEnabled(persistent action.InputParams) bool {
	if persistent == nil {
		return false
	}

	quietValue, exists := persistent["quiet"]
	if !exists {
		return false
	}

	quietBool, ok := quietValue.(bool)
	return ok && quietBool
}
