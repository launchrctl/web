//go:build !windows
// +build !windows

package web

import (
	"os"
	"os/exec"
	"syscall"

	"github.com/launchrctl/launchr/pkg/log"
)

func setSysProcAttr(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setsid: true,
	}
}

func isProcessRunning(pid int) bool {
	process, err := os.FindProcess(pid)
	if err != nil {
		log.Debug("Failed to find process: %s\n", err)
		return false
	}

	err = process.Signal(syscall.Signal(0))
	if err == nil {
		return true
	}

	if err.Error() == "os: process already finished" {
		return false
	}

	return true
}
