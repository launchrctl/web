package server

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/launchrctl/launchr"
)

type fileStreams interface {
	GetStreamData(GetRunningActionStreamsParams) ([]*ActionRunStreamData, error)
}

// webCli implements Streams interface.
// @todo Maybe refactor original streams.
type webCli struct {
	in    *launchr.In
	out   *launchr.Out
	err   io.Writer
	files []*os.File
}

// In returns the reader used for stdin
func (cli *webCli) In() *launchr.In {
	return cli.in
}

// Out returns the writer used for stdout
func (cli *webCli) Out() *launchr.Out {
	return cli.out
}

// Err returns the writer used for stderr
func (cli *webCli) Err() io.Writer {
	return cli.err
}

// Close implements io.Closer.
func (cli *webCli) Close() (err error) {
	for i := 0; i < len(cli.files); i++ {
		_ = cli.files[i].Close()
	}
	return nil
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

func createFileStreams(streamsDir, runId string) (*webCli, error) {
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

	// Build and return webCli
	return &webCli{
		files: []*os.File{outfile, errfile},
		in:    launchr.NewIn(io.NopCloser(strings.NewReader(""))),
		out:   launchr.NewOut(out),
		err:   errWriter,
	}, nil
}
