# NOTE: update the --since date to the date of the last release.
git log --show-pulls --pretty=tformat:"%s" --since=2023-08-13 > changelog.txt | node gitlog.js changelog.txt
rm changelog.txt