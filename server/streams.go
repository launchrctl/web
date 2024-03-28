package server

import (
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/launchrctl/launchr/pkg/cli"
)

// webCli implements Streams interface.
// @todo Maybe refactor original streams.
type webCli struct {
	in    *cli.In
	out   *cli.Out
	err   io.Writer
	files []*os.File
}

// In returns the reader used for stdin
func (cli *webCli) In() *cli.In {
	return cli.in
}

// Out returns the writer used for stdout
func (cli *webCli) Out() *cli.Out {
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

type wrappedWriter struct {
	p ActionRunStreamDataType
	w io.Writer
}

func (w *wrappedWriter) Write(p []byte) (int, error) {
	return w.w.Write(p)
}

func fileStreams(actionId ActionId) (*webCli, error) {
	outfile, err := os.Create(fmt.Sprintf("%s-out.txt", actionId))
	if err != nil {
		return nil, fmt.Errorf("error creating output file: %w", err)
	}

	errfile, err := os.Create(fmt.Sprintf("%s-err.txt", actionId))
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
		in:    cli.NewIn(io.NopCloser(strings.NewReader(""))),
		out:   cli.NewOut(out),
		err:   errWriter,
	}, nil
}
