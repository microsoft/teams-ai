#!/bin/bash

# Directory containing markdown files
TEAMS_MD_DIR="/home/runner/work/teams-ai/teams-ai/teams.md"
BACKUP_DIR="/tmp/teams-md-backup"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Find all markdown files
MD_FILES=$(find "$TEAMS_MD_DIR" -type f -name "*.md")

# Counter for processed files
processed=0

# Process each file
for file in $MD_FILES; do
  # Check if file contains any of the patterns we need to replace
  if grep -q -i "teams toolkit\|TTK" "$file"; then
    # Get the relative path for backup
    rel_path=${file#/home/runner/work/teams-ai/teams-ai/}
    backup_file="$BACKUP_DIR/${rel_path//\//_}"
    
    # Create backup
    cp "$file" "$backup_file"
    echo "Created backup: $backup_file"
    
    # Replace "Teams Toolkit" with "M365 Agents Toolkit" (preserving case)
    sed -i 's/Teams Toolkit/M365 Agents Toolkit/g' "$file"
    
    # Replace "teams toolkit" (lowercase) with "M365 Agents Toolkit"
    sed -i 's/teams toolkit/M365 Agents Toolkit/g' "$file"
    sed -i 's/Teams toolkit/M365 Agents Toolkit/g' "$file"
    
    # Replace "TTK" with "M365 Agents Toolkit" 
    sed -i 's/TTK/M365 Agents Toolkit/g' "$file"
    
    echo "Processed: $file"
    ((processed++))
  fi
done

echo "Total files processed: $processed"

# Count remaining instances of "Teams Toolkit" to verify replacements
remaining=$(find "$TEAMS_MD_DIR" -type f -name "*.md" -exec grep -l -i "teams toolkit" {} \; | wc -l)
echo "Remaining instances of 'Teams Toolkit': $remaining"

# Count remaining instances of "TTK" to verify replacements
remaining_ttk=$(find "$TEAMS_MD_DIR" -type f -name "*.md" -exec grep -l "TTK" {} \; | wc -l)
echo "Remaining instances of 'TTK': $remaining_ttk"