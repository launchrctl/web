package server

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"filippo.io/age"
	"github.com/fsnotify/fsnotify"

	"github.com/launchrctl/launchr/pkg/action"
)

// TokenStore manages storage, validation, and persistence of API tokens with file-based synchronization.
type TokenStore struct {
	action.WithLogger

	tokens   map[string]*TokenInfo
	filePath string

	passphrase string
	mutex      sync.RWMutex
	watcher    *fsnotify.Watcher
	stopChan   chan struct{}
}

// TokenInfo represents metadata associated with an API token.
type TokenInfo struct {
	Token     string     `json:"token"`
	Name      string     `json:"name"`
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	Active    bool       `json:"active"`
}

// TokenFile represents the format of the token file.
type TokenFile struct {
	Tokens []*TokenInfo `json:"tokens"`
}

// NewTokenStore creates a new TokenStore.
func NewTokenStore(configDir string, passphrase string) (*TokenStore, error) {
	if passphrase == "" {
		return nil, fmt.Errorf("passphrase is required for encrypted token store")
	}

	tokenFile := filepath.Join(configDir, "api-tokens.json.age")

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("failed to create file watcher: %w", err)
	}

	store := &TokenStore{
		tokens:     make(map[string]*TokenInfo),
		filePath:   tokenFile,
		watcher:    watcher,
		passphrase: passphrase,
		stopChan:   make(chan struct{}),
	}

	if err = store.loadFromFile(); err != nil {
		_ = watcher.Close()
		return nil, fmt.Errorf("failed to load tokens: %w", err)
	}

	// Start watching the token file
	go store.watchFile()

	// Add the directory to watcher (some systems need directory watching)
	if err = watcher.Add(filepath.Dir(tokenFile)); err != nil {
		_ = watcher.Close()
		return nil, fmt.Errorf("failed to watch token directory: %w", err)
	}

	return store, nil
}

func (ts *TokenStore) watchFile() {
	for {
		select {
		case event, ok := <-ts.watcher.Events:
			if !ok {
				return
			}

			// Check if it's our token file and it was modified
			if filepath.Clean(event.Name) == ts.filePath && event.Op&fsnotify.Write == fsnotify.Write {
				ts.reloadFromFile()
			}

		case err, ok := <-ts.watcher.Errors:
			if !ok {
				return
			}
			// Log error but continue watching
			logger := ts.Log()
			if logger != nil {
				logger.Error(fmt.Sprintf("Token store watcher error: %v", err))
			}

		case <-ts.stopChan:
			return
		}
	}
}

// Close closes the TokenStore and stops watching the token file.
func (ts *TokenStore) Close() error {
	close(ts.stopChan)
	return ts.watcher.Close()
}

func (ts *TokenStore) reloadFromFile() {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	if err := ts.loadFromFile(); err != nil {
		logger := ts.Log()
		if logger != nil {
			logger.Error(fmt.Sprintf("Failed to reload tokens: %v\n", err))
		}
	}
}

func (ts *TokenStore) loadFromFile() error {
	if _, err := os.Stat(ts.filePath); os.IsNotExist(err) {
		// File doesn't exist, start with an empty store
		return nil
	}

	// Read an encrypted file
	encryptedData, err := os.ReadFile(ts.filePath)
	if err != nil {
		return fmt.Errorf("failed to read encrypted token file: %w", err)
	}

	// Decrypt the data
	data, err := ts.decrypt(encryptedData)
	if err != nil {
		return fmt.Errorf("failed to decrypt token file: %w", err)
	}

	var tokenFile TokenFile
	if err = json.Unmarshal(data, &tokenFile); err != nil {
		return fmt.Errorf("failed to parse token file: %w", err)
	}

	ts.tokens = make(map[string]*TokenInfo)
	for _, token := range tokenFile.Tokens {
		ts.tokens[token.Token] = token
	}

	return nil
}

func (ts *TokenStore) saveToFile() error {
	if err := os.MkdirAll(filepath.Dir(ts.filePath), 0700); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	var tokens []*TokenInfo
	for _, token := range ts.tokens {
		tokens = append(tokens, token)
	}

	tokenFile := TokenFile{Tokens: tokens}
	data, err := json.MarshalIndent(tokenFile, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal tokens: %w", err)
	}

	encryptedData, err := ts.encrypt(data)
	if err != nil {
		return fmt.Errorf("failed to encrypt token data: %w", err)
	}

	if err = os.WriteFile(ts.filePath, encryptedData, 0600); err != nil {
		return fmt.Errorf("failed to write encrypted token file: %w", err)
	}

	return nil
}

func (ts *TokenStore) encrypt(data []byte) ([]byte, error) {
	recipient, err := age.NewScryptRecipient(ts.passphrase)
	if err != nil {
		return nil, fmt.Errorf("failed to create scrypt recipient: %w", err)
	}

	var buf strings.Builder
	w, err := age.Encrypt(&buf, recipient)
	if err != nil {
		return nil, fmt.Errorf("failed to create age writer: %w", err)
	}

	if _, err = w.Write(data); err != nil {
		return nil, fmt.Errorf("failed to write encrypted data: %w", err)
	}

	if err = w.Close(); err != nil {
		return nil, fmt.Errorf("failed to close age writer: %w", err)
	}

	return []byte(buf.String()), nil
}

func (ts *TokenStore) decrypt(encryptedData []byte) ([]byte, error) {
	identity, err := age.NewScryptIdentity(ts.passphrase)
	if err != nil {
		return nil, fmt.Errorf("failed to create scrypt identity: %w", err)
	}

	r, err := age.Decrypt(strings.NewReader(string(encryptedData)), identity)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt data: %w", err)
	}

	data, err := io.ReadAll(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read decrypted data: %w", err)
	}

	return data, nil
}

// CreateToken generates a new API token and persists the data to a file.
func (ts *TokenStore) CreateToken(name string, expiresIn *time.Duration) (*TokenInfo, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	token := "wt_" + hex.EncodeToString(bytes)

	tokenInfo := &TokenInfo{
		Token:     token,
		Name:      name,
		CreatedAt: time.Now(),
		Active:    true,
	}

	if expiresIn != nil {
		expiresAt := time.Now().Add(*expiresIn)
		tokenInfo.ExpiresAt = &expiresAt
	}

	ts.mutex.Lock()
	ts.tokens[token] = tokenInfo
	ts.mutex.Unlock()

	if err := ts.saveToFile(); err != nil {
		return nil, fmt.Errorf("failed to save token: %w", err)
	}

	return tokenInfo, nil
}

// ValidateToken validates a token and updates the last used time.
func (ts *TokenStore) ValidateToken(token string) bool {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	tokenInfo, exists := ts.tokens[token]
	if !exists || !tokenInfo.Active {
		return false
	}

	if ts.isTokenExpired(tokenInfo) {
		// Auto-revoke expired tokens
		tokenInfo.Active = false
		go func() {
			err := ts.saveToFile()
			if err != nil {
				logger := ts.Log()
				if logger != nil {
					logger.Error(fmt.Sprintf("Failed to re-save token: %v", err))
				}
			}
		}()
		return false
	}

	return true
}

// RevokeToken marks a token as inactive and persists the data to a file.
func (ts *TokenStore) RevokeToken(tokenOrName string) bool {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	// Try to find by token first, then by name
	var targetToken *TokenInfo
	for _, token := range ts.tokens {
		if token.Token == tokenOrName || token.Name == tokenOrName {
			targetToken = token
			break
		}
	}

	if targetToken == nil {
		return false
	}

	targetToken.Active = false
	err := ts.saveToFile()
	if err != nil {
		logger := ts.Log()
		if logger != nil {
			logger.Error(fmt.Sprintf("Failed to save token: %v", err))
		}
	}
	return true
}

// ListTokens returns a list of all tokens in the store.
func (ts *TokenStore) ListTokens() []*TokenInfo {
	ts.mutex.RLock()
	defer ts.mutex.RUnlock()

	var tokens []*TokenInfo
	for _, tokenInfo := range ts.tokens {
		tokens = append(tokens, tokenInfo)
	}
	return tokens
}

// DeleteToken removes a token from the store and persists the updated store to a file.
func (ts *TokenStore) DeleteToken(tokenOrName string) bool {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	var tokenToDelete string
	for token, info := range ts.tokens {
		if token == tokenOrName || info.Name == tokenOrName {
			tokenToDelete = token
			break
		}
	}

	if tokenToDelete == "" {
		return false
	}

	delete(ts.tokens, tokenToDelete)
	err := ts.saveToFile()
	if err != nil {
		logger := ts.Log()
		if logger != nil {
			logger.Error(fmt.Sprintf("Failed to save token: %v", err))
		}
	}
	return true
}

func (ts *TokenStore) isTokenExpired(tokenInfo *TokenInfo) bool {
	return tokenInfo.ExpiresAt != nil && time.Now().After(*tokenInfo.ExpiresAt)
}

// PurgeInactiveTokens marks expired tokens as inactive and removes all inactive tokens from storage
func (ts *TokenStore) PurgeInactiveTokens() (expired int, removed int) {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	// mark expired tokens as inactive
	for _, tokenInfo := range ts.tokens {
		if ts.isTokenExpired(tokenInfo) && tokenInfo.Active {
			tokenInfo.Active = false
			expired++
		}
	}

	// remove all inactive tokens
	for token, tokenInfo := range ts.tokens {
		if !tokenInfo.Active {
			delete(ts.tokens, token)
			removed++
		}
	}

	// Save changes if any cleanup occurred
	if expired > 0 || removed > 0 {
		if err := ts.saveToFile(); err != nil {
			logger := ts.Log()
			if logger != nil {
				logger.Error(fmt.Sprintf("Failed to save token: %v", err))
			}
		}
	}

	return expired, removed
}
