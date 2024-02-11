package server

import (
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

func fileStreams() *webCli {
	// @todo wrap writer to prepend info
	outfile, _ := os.Create("out.txt")
	errfile, _ := os.Create("err.txt")
	out := &wrappedWriter{
		p: StdOut,
		w: outfile,
	}
	err := &wrappedWriter{
		p: StdErr,
		w: errfile,
	}
	return &webCli{
		files: []*os.File{outfile, errfile},
		in:    cli.NewIn(io.NopCloser(strings.NewReader(""))),
		out:   cli.NewOut(out),
		err:   err,
	}
}
