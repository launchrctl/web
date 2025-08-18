package server

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/launchrctl/keyring"
	"github.com/launchrctl/launchr/pkg/action"
)

const tokensKey = "web-tokens"

// TokenStore manages storage, validation, and persistence of web tokens with file-based synchronization.
type TokenStore struct {
	action.WithLogger

	tokens map[string]*TokenInfo
	loaded bool

	mutex sync.RWMutex
	k     keyring.Keyring
}

// TokenInfo represents metadata associated with an web token.
type TokenInfo struct {
	TokenHash string
	Name      string
	Created   time.Time
	Expires   *time.Time
}

// NewTokenStore creates a new TokenStore.
func NewTokenStore(k keyring.Keyring) (*TokenStore, error) {
	store := &TokenStore{
		tokens: make(map[string]*TokenInfo),
		k:      k,
	}

	err := store.Load()
	return store, err
}

// hashToken creates an SHA-256 hash of the token
func (ts *TokenStore) hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// generateToken creates a new random token
func (ts *TokenStore) generateToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// Load loads the tokens from the keyring.
func (ts *TokenStore) Load() error {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	if ts.loaded {
		return nil
	}

	item, err := ts.k.GetForKey(tokensKey)
	if err != nil {
		if errors.Is(err, keyring.ErrNotFound) {
			return nil
		}
		return err
	}

	if data, ok := item.Value.([]any); ok {
		var tokens []*TokenInfo
		for i, tokenData := range data {
			tokenMap, okToken := tokenData.(map[string]any)
			if !okToken {
				return fmt.Errorf("item at index %d is not a map, got %T", i, item)
			}

			tokenInfo, err := ts.convertMapToTokenInfo(tokenMap)
			if err != nil {
				return fmt.Errorf("can't convert item at index %d: %w", i, err)
			}

			tokens = append(tokens, tokenInfo)
		}

		ts.loaded = true
		ts.tokens = make(map[string]*TokenInfo)
		for _, token := range tokens {
			ts.tokens[token.TokenHash] = token
		}
		return nil
	}

	return fmt.Errorf("failed to retrieve tokens from storage")
}

func (ts *TokenStore) convertMapToTokenInfo(itemMap map[string]any) (*TokenInfo, error) {
	tokenInfo := &TokenInfo{}

	// Convert token_hash
	if tokenHash, exists := itemMap["tokenhash"]; exists {
		if str, ok := tokenHash.(string); ok {
			tokenInfo.TokenHash = str
		} else {
			return nil, fmt.Errorf("token_hash is not a string, got %T", tokenHash)
		}
	}

	// Convert name
	if name, exists := itemMap["name"]; exists {
		if str, ok := name.(string); ok {
			tokenInfo.Name = str
		} else {
			return nil, fmt.Errorf("name is not a string, got %T", name)
		}
	}

	// Convert created_at
	if created, exists := itemMap["created"]; exists {
		if t, ok := created.(time.Time); ok {
			tokenInfo.Created = t
		} else {
			return nil, fmt.Errorf("created_at is not a time.Time, got %T", created)
		}
	}

	// Convert expires (optional)
	if expires, exists := itemMap["expires"]; exists && expires != nil {
		if t, ok := expires.(time.Time); ok {
			tokenInfo.Expires = &t
		} else {
			return nil, fmt.Errorf("expires is not a string, got %T", expires)
		}
	}

	return tokenInfo, nil
}

func (ts *TokenStore) save() error {
	var tokens []*TokenInfo
	for _, token := range ts.tokens {
		tokens = append(tokens, token)
	}

	if len(tokens) > 0 {
		item := keyring.KeyValueItem{
			Value: tokens,
			Key:   tokensKey,
		}

		err := ts.k.AddItem(item)
		if err != nil {
			return err
		}
	} else {
		err := ts.k.RemoveByKey(tokensKey)
		if err != nil && !errors.Is(err, keyring.ErrNotFound) {
			return err
		}
	}

	err := ts.k.Save()
	if err != nil {
		return err
	}

	ts.loaded = false
	ts.k.ResetStorage()

	return nil
}

// CreateToken generates a new web token and persists the data to a file.
func (ts *TokenStore) CreateToken(name string, size int, expires time.Duration) (string, *TokenInfo, error) {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	if strings.TrimSpace(name) == "" {
		return "", nil, fmt.Errorf("token name cannot be empty")
	}

	// Check if the name already exists
	for _, tokenInfo := range ts.tokens {
		if tokenInfo.Name == name {
			return "", nil, fmt.Errorf("token with name '%s' already exists", name)
		}
	}

	// Generate an actual token (this is returned to the user)
	token, err := ts.generateToken(size)
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate token: %w", err)
	}

	tokenHash := ts.hashToken(token)

	// Hash the token for storage
	tokenInfo := &TokenInfo{
		TokenHash: tokenHash,
		Name:      name,
		Created:   time.Now(),
	}

	if expires != 0 {
		expiresAt := time.Now().Add(expires)
		tokenInfo.Expires = &expiresAt
	}

	ts.tokens[tokenHash] = tokenInfo

	if err = ts.save(); err != nil {
		return "", nil, fmt.Errorf("failed to save token: %w", err)
	}

	return token, tokenInfo, nil
}

// ValidateToken validates a token and updates the last used time.
func (ts *TokenStore) ValidateToken(token string) bool {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	hashedToken := ts.hashToken(token)
	tokenInfo, exists := ts.tokens[hashedToken]
	if !exists {
		return false
	}

	return !ts.isTokenExpired(tokenInfo)
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
func (ts *TokenStore) DeleteToken(name string) bool {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	var ti *TokenInfo
	for _, tokenInfo := range ts.tokens {
		if tokenInfo.Name == name {
			ti = tokenInfo
			break
		}
	}

	if ti == nil {
		return false
	}

	delete(ts.tokens, ti.TokenHash)
	err := ts.save()
	if err != nil {
		ts.Log().Error("failed to save token", "error", err)
	}
	return true
}

func (ts *TokenStore) isTokenExpired(tokenInfo *TokenInfo) bool {
	return tokenInfo.Expires != nil && time.Now().After(*tokenInfo.Expires)
}

// PurgeInactiveTokens removes all expired tokens from storage
func (ts *TokenStore) PurgeInactiveTokens() (expired int) {
	ts.mutex.Lock()
	defer ts.mutex.Unlock()

	// mark expired tokens as inactive
	for hash, tokenInfo := range ts.tokens {
		if ts.isTokenExpired(tokenInfo) {
			delete(ts.tokens, hash)
			expired++
		}
	}

	if expired < 1 {
		return 0
	}

	// Save changes if tokens were removed
	if err := ts.save(); err != nil {
		ts.Log().Error("failed to save token", "error", err)
	}

	return expired
}

// ParseDurationWithDays parses a string with token date formats into a time.Duration.
func ParseDurationWithDays(s string) (time.Duration, error) {
	// Convert to lowercase for case-insensitive matching
	s = strings.ToLower(s)

	// Token-appropriate time units only
	unitMap := map[string]time.Duration{
		"h": time.Hour,            // hours
		"d": 24 * time.Hour,       // days
		"w": 7 * 24 * time.Hour,   // weeks
		"m": 30 * 24 * time.Hour,  // months (30 days)
		"y": 365 * 24 * time.Hour, // years (365 days)
	}

	// Parse custom units
	for unit, multiplier := range unitMap {
		if strings.HasSuffix(s, unit) {
			numStr := strings.TrimSuffix(s, unit)
			num, err := strconv.ParseFloat(numStr, 64)
			if err != nil {
				return 0, fmt.Errorf("invalid numeric value '%s' for unit '%s'", numStr, unit)
			}
			if num <= 0 {
				return 0, fmt.Errorf("duration must be positive, got %g%s", num, unit)
			}
			return time.Duration(float64(multiplier) * num), nil
		}
	}

	return 0, fmt.Errorf("invalid duration format: %s (supported: h, d, w, m, y)", s)
}
