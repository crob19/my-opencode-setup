#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Installing OpenCode Commands..."

# Check if OpenCode config directory exists
if [ ! -d "$HOME/.config/opencode" ]; then
    echo -e "${YELLOW}⚠️  OpenCode config directory not found. Creating it...${NC}"
    mkdir -p "$HOME/.config/opencode/command"
fi

# Check if command directory exists
if [ ! -d "$HOME/.config/opencode/command" ]; then
    echo -e "${YELLOW}Creating command directory...${NC}"
    mkdir -p "$HOME/.config/opencode/command"
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if commands directory exists
if [ ! -d "$SCRIPT_DIR/commands" ]; then
    echo -e "${RED}❌ Error: commands directory not found!${NC}"
    exit 1
fi

# Count commands to install
COMMAND_COUNT=$(ls -1 "$SCRIPT_DIR/commands"/*.md 2>/dev/null | wc -l)

if [ "$COMMAND_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Error: No command files found in commands directory!${NC}"
    exit 1
fi

echo -e "${GREEN}Found $COMMAND_COUNT commands to install${NC}"

# Create symlinks
echo "Creating symlinks..."
for cmd_file in "$SCRIPT_DIR/commands"/*.md; do
    cmd_name=$(basename "$cmd_file")
    target="$HOME/.config/opencode/command/$cmd_name"
    
    # Remove existing symlink or file if it exists
    if [ -e "$target" ] || [ -L "$target" ]; then
        echo -e "${YELLOW}  Replacing existing: $cmd_name${NC}"
        rm "$target"
    fi
    
    # Create symlink
    ln -s "$cmd_file" "$target"
    echo -e "${GREEN}  ✓ Installed: $cmd_name${NC}"
done

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "Commands installed:"
ls -1 "$HOME/.config/opencode/command" | grep -E "\.md$" | sed 's/\.md$//' | sed 's/^/  \//g'
echo ""
echo "Usage: Type / in OpenCode TUI to see all available commands"
echo ""
echo "To update: cd $SCRIPT_DIR && git pull"
