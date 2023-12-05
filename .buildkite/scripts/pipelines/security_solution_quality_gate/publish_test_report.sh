#!/bin/bash

npm install -g junit-report-merger

mkdir target
buildkite-agent artifact download '*.xml' target/

jrm target/combined.xml "target/*.xml"

ls target

cat target/combined.xml

# cat target/kibana-security-solution/cypress/results/output.json