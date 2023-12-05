#!/bin/bash

source .buildkite/scripts/common/util.sh
.buildkite/scripts/bootstrap.sh

npm install -g junit-report-merger

mkdir report
buildkite-agent artifact download '*.xml' report/

echo "Checking report"
ls report/target/junit

echo "Combining files"
jrm report/combined.xml "report/target/junit/*.xml"

echo "Checking report"
ls report/target/junit

echo "Checking combined content"
cat report/combined.xml

cd report

BK_ANALYTICS_API_KEY=$(retry 5 5 vault read -field=serverless-sec-sol-cypress-bk-api-key secret/kibana-issues/dev/security-solution-qg-enc-key)

curl \
  -X POST \
  -H "Authorization: Token token=\"$BK_ANALYTICS_API_KEY\"" \
  -F "data=@combined.xml" \
  -F "format=junit" \
  -F "run_env[CI]=buildkite" \
  -F "run_env[key]=$BUILDKITE_BUILD_ID" \
  -F "run_env[url]=$BUILDKITE_BUILD_URL" \
  -F "run_env[branch]=$BUILDKITE_BRANCH" \
  -F "run_env[commit_sha]=$BUILDKITE_COMMIT" \
  -F "run_env[number]=$BUILDKITE_BUILD_NUMBER" \
  -F "run_env[job_id]=$BUILDKITE_JOB_ID" \
  -F "run_env[message]=$BUILDKITE_MESSAGE" \
  https://analytics-api.buildkite.com/v1/uploads