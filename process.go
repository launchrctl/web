package web

import (
	"errors"
	"os"
	"path/filepath"
	"strconv"

	"github.com/launchrctl/launchr/pkg/log"
)

func pidFileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func readPidFile(path string) (int, error) {
	data, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		log.Debug(err.Error())
		return 0, errors.New("error reading PID file")
	}

	pid, err := strconv.Atoi(string(data))
	if err != nil {
		log.Debug(err.Error())
		return 0, errors.New("error converting PID from file")
	}

	return pid, nil
}

func removePidFile(path string) error {
	err := os.Remove(path)
	if err != nil {
		log.Debug(err.Error())
		return errors.New("error removing PID file")
	}

	return err
}

func killProcess(pid int) error {
	process, err := os.FindProcess(pid)
	if err != nil {
		log.Debug(err.Error())
		return errors.New("error finding process")
	}

	if err = process.Kill(); err != nil {
		log.Debug(err.Error())
		log.Info("error killing process")
	}

	return nil
}
