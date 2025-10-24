#!/bin/bash

# G1 Studio - New Branch Creator
# Creates a new branch with a standardized naming convention

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[G1]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[G1]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[G1]${NC} $1"
}

print_error() {
    echo -e "${RED}[G1]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository!"
    exit 1
fi

# Get current branch
current_branch=$(git branch --show-current)

# If already on main, we're good to create a new branch
if [ "$current_branch" = "main" ]; then
    print_status "Currently on main branch - ready to create new branch"
else
    print_warning "Currently on branch: $current_branch"
    echo "Do you want to switch to main first? (y/n)"
    read -r switch_to_main
    if [ "$switch_to_main" = "y" ] || [ "$switch_to_main" = "Y" ]; then
        print_status "Switching to main..."
        git checkout main
        git pull origin main 2>/dev/null || print_warning "Could not pull from origin (working offline?)"
    fi
fi

# Branch type options
echo ""
print_status "Select branch type:"
echo "1) feat/    - New feature"
echo "2) fix/     - Bug fix"
echo "3) docs/    - Documentation"
echo "4) refactor/ - Code refactoring"
echo "5) test/    - Testing"
echo "6) chore/   - Maintenance"
echo "7) custom   - Custom prefix"

read -p "Enter choice (1-7): " choice

case $choice in
    1) prefix="feat/" ;;
    2) prefix="fix/" ;;
    3) prefix="docs/" ;;
    4) prefix="refactor/" ;;
    5) prefix="test/" ;;
    6) prefix="chore/" ;;
    7) 
        read -p "Enter custom prefix (with trailing slash): " prefix
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Get branch description
read -p "Enter branch description (kebab-case): " description

if [ -z "$description" ]; then
    print_error "Branch description cannot be empty"
    exit 1
fi

# Create branch name
branch_name="${prefix}${description}"

# Validate branch name (basic check)
if [[ ! "$branch_name" =~ ^[a-zA-Z0-9/_-]+$ ]]; then
    print_error "Invalid branch name. Use only letters, numbers, hyphens, underscores, and slashes."
    exit 1
fi

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    print_error "Branch '$branch_name' already exists!"
    exit 1
fi

# Create and switch to new branch
print_status "Creating branch: $branch_name"
git checkout -b "$branch_name"

print_success "✅ Successfully created and switched to branch: $branch_name"
print_status "You're now ready to start working!"

# Optional: Set up branch tracking
echo ""
echo "Do you want to push this branch to origin and set up tracking? (y/n)"
read -r setup_tracking
if [ "$setup_tracking" = "y" ] || [ "$setup_tracking" = "Y" ]; then
    print_status "Setting up remote tracking..."
    git push -u origin "$branch_name" 2>/dev/null || print_warning "Could not push to origin (working offline?)"
    print_success "Branch tracking set up!"
fi

echo ""
print_status "Happy coding! 🚀"