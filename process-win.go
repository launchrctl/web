//go:build windows
// +build windows

package web

import (
	"os/exec"

	"golang.org/x/sys/windows"
)

const STILL_ACTIVE = 259

func setSysProcAttr(cmd *exec.Cmd) {
	cmd.SysProcAttr = &windows.SysProcAttr{
		CreationFlags: windows.CREATE_NEW_PROCESS_GROUP,
	}
}

func isProcessRunning(pid int) bool {
	h, err := windows.OpenProcess(windows.PROCESS_QUERY_LIMITED_INFORMATION, false, uint32(pid))
	if err != nil {
		return false
	}
	defer windows.CloseHandle(h)

	var code uint32
	err = windows.GetExitCodeProcess(h, &code)
	if err != nil {
		return false
	}
	return code == STILL_ACTIVE
}
