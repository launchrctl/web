package web

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

func pidFileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func readPidFile(path string) (int, error) {
	data, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		return 0, fmt.Errorf("error reading PID file: %w", err)
	}

	pid, err := strconv.Atoi(string(data))
	if err != nil {
		return 0, fmt.Errorf("error converting PID from file: %w", err)
	}

	return pid, nil
}

func killProcess(pid int) error {
	process, err := os.FindProcess(pid)
	if err != nil {
		return fmt.Errorf("error finding process: %w", err)
	}

	if err = process.Kill(); err != nil {
		return fmt.Errorf("error killing process: %w", err)
	}

	return nil
}

func interruptProcess(pid int) error {
	process, err := os.FindProcess(pid)
	if err != nil {
		return fmt.Errorf("error finding process: %w", err)
	}

	if err = process.Signal(os.Interrupt); err != nil {
		return fmt.Errorf("error interrupting process: %w", err)
	}

	return nil
}
