//go:build windows

package web

import (
	"os/exec"

	"golang.org/x/sys/windows"
)

func setSysProcAttr(cmd *exec.Cmd) {
	cmd.SysProcAttr = &windows.SysProcAttr{
		CreationFlags: windows.CREATE_NEW_PROCESS_GROUP,
	}
}

func isProcessRunning(pid int) bool {
	p := uint32(pid)
	h, err := windows.OpenProcess(windows.PROCESS_QUERY_LIMITED_INFORMATION, false, p)
	if err != nil {
		return false
	}
	defer windows.CloseHandle(h)

	var code uint32
	err = windows.GetExitCodeProcess(h, &code)
	if err != nil {
		return false
	}
	if windows.NTStatus(code) == windows.STATUS_PENDING {
		return true
	}

	return false
}
