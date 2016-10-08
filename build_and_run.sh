npm run output
s3cmd sync --delete-removed public/ s3://${AWS_BUCKET}/bamboohr-employee-stats/
