/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import React from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiCode,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiSplitPanel,
  EuiSteps,
  EuiTab,
  EuiTabs,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import major from 'semver/functions/major';
import { useProfilingParams } from '../../hooks/use_profiling_params';
import { useProfilingRouter } from '../../hooks/use_profiling_router';
import { useProfilingRoutePath } from '../../hooks/use_profiling_route_path';
import { AsyncStatus, useAsync } from '../../hooks/use_async';
import { useProfilingDependencies } from '../../components/contexts/profiling_dependencies/use_profiling_dependencies';
import { ProfilingAppPageTemplate } from '../../components/profiling_app_page_template';

export enum AddDataTabs {
  Kubernetes = 'kubernetes',
  Docker = 'docker',
  Binary = 'binary',
  Deb = 'deb',
  RPM = 'rpm',
  ElasticAgentIntegration = 'elasticAgentIntegration',
  Symbols = 'symbols',
}

export function AddDataView() {
  const { query } = useProfilingParams('/add-data-instructions');
  const { selectedTab } = query;
  const profilingRouter = useProfilingRouter();
  const routePath = useProfilingRoutePath();

  const {
    services: { setupDataCollectionInstructions },
    start: { core },
  } = useProfilingDependencies();

  const { data, status } = useAsync(
    ({ http }) => {
      return setupDataCollectionInstructions({ http });
    },
    [setupDataCollectionInstructions]
  );

  const secretToken = data?.collector?.secretToken;
  const collectionAgentHost = data?.collector?.host;
  const symbolUrl = data?.symbolizer?.host;
  const stackVersion = data?.stackVersion!;
  const majorVersion = stackVersion ? major(stackVersion).toString() : undefined;

  const tabs = [
    {
      key: AddDataTabs.Kubernetes,
      title: i18n.translate('xpack.profiling.tabs.kubernetesTitle', {
        defaultMessage: 'Kubernetes',
      }),
      steps: [
        {
          title: i18n.translate('xpack.profiling.tabs.kubernetesRepositoryStep', {
            defaultMessage: 'Configure the Universal Profiling host-agent Helm repository:',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              helm repo add elastic https://helm.elastic.co
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.kubernetesInstallStep', {
            defaultMessage: 'Install host-agent via Helm:',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`helm install --create-namespace -n=universal-profiling universal-profiling-agent \\
--set "projectID=1,secretToken=${secretToken}" \\
--set "collectionAgentHostPort=${collectionAgentHost}" \\
--set "version=${stackVersion}" \\
--version=${stackVersion} \\
elastic/pf-host-agent`}
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.kubernetesValidationStep', {
            defaultMessage: 'Validate the host-agent pods are running:',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              kubectl -n universal-profiling get pods
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.postValidationStep', {
            defaultMessage:
              'Use the Helm install output to get host-agent logs and spot potential errors',
          }),
          content: <></>,
        },
      ],
    },
    {
      key: AddDataTabs.Docker,
      title: i18n.translate('xpack.profiling.tabs.dockerTitle', {
        defaultMessage: 'Docker',
      }),
      steps: [
        {
          title: i18n.translate('xpack.profiling.tabs.dockerRunContainerStep', {
            defaultMessage: 'Run the Universal Profiling container:',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`docker run --name pf-host-agent --privileged --pid=host -v /etc/machine-id:/etc/machine-id:ro \\
-v /var/run/docker.sock:/var/run/docker.sock -v /sys/kernel/debug:/sys/kernel/debug:ro \\
docker.elastic.co/observability/profiling-agent:${stackVersion} /root/pf-host-agent \\
-project-id=1 -secret-token=${secretToken} \\
-collection-agent=${collectionAgentHost}`}
            </EuiCodeBlock>
          ),
        },
      ],
    },
    {
      key: AddDataTabs.Binary,
      title: i18n.translate('xpack.profiling.tabs.binaryTitle', {
        defaultMessage: 'Binary',
      }),
      steps: [
        {
          title: i18n.translate('xpack.profiling.tabs.binaryDownloadStep', {
            defaultMessage: 'Download the binary for the right architecture:',
          }),
          content: (
            <EuiText>
              <b>For x86_64:</b>
              <EuiSpacer size="s" />
              <EuiCodeBlock paddingSize="s" isCopyable>
                {`wget -O pf-host-agent.tgz "https://artifacts.elastic.co/downloads/prodfiler/pf-host-agent-${stackVersion}-linux-x86_64.tar.gz" && tar xzf pf-host-agent.tgz`}
              </EuiCodeBlock>
              <EuiSpacer size="m" />
              <b>For ARM64:</b>
              <EuiSpacer size="s" />
              <EuiCodeBlock paddingSize="s" isCopyable>
                {`wget -O pf-host-agent.tgz "https://artifacts.elastic.co/downloads/prodfiler/pf-host-agent-${stackVersion}-linux-arm64.tar.gz" && tar xzf pf-host-agent.tgz`}
              </EuiCodeBlock>
            </EuiText>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.binaryGrantPermissionStep', {
            defaultMessage: 'Grant executable permissions:',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              chmod +x pf-host-agent/pf-host-agent
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.binaryRunHostAgentStep', {
            defaultMessage: 'Run the Universal Profiling host-agent (requires root privileges):',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`sudo pf-host-agent/pf-host-agent -project-id=1 -secret-token=${secretToken} -collection-agent=${collectionAgentHost}`}
            </EuiCodeBlock>
          ),
        },
      ],
    },
    {
      key: AddDataTabs.Deb,
      title: i18n.translate('xpack.profiling.tabs.debTitle', {
        defaultMessage: 'DEB Package',
      }),
      steps: [
        {
          title: i18n.translate('xpack.profiling.tabs.debConfigureRepoStep', {
            defaultMessage: 'Configure the apt repository (requires root privileges):',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
sudo apt-get install apt-transport-https
echo "deb https://artifacts.elastic.co/packages/${majorVersion}.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-${majorVersion}.x.list
`}
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.debInstallPackageStep', {
            defaultMessage: 'Install the DEB package (requires root privileges):',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`sudo apt-get update && sudo apt-get install pf-host-agent`}
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.debEditConfigStep', {
            defaultMessage: 'Edit the configuration (requires root privileges):',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`echo -e "project-id 1\nsecret-token ${secretToken}\ncollection-agent ${collectionAgentHost}" | sudo tee -a /etc/Elastic/universal-profiling/pf-host-agent.conf`}
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.debStartSystemdServiceStep', {
            defaultMessage:
              'Start the Universal Profiling systemd service (requires root privileges):',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`sudo systemctl enable pf-host-agent && sudo systemctl restart pf-host-agent`}
            </EuiCodeBlock>
          ),
        },
      ],
    },
    {
      key: AddDataTabs.RPM,
      title: i18n.translate('xpack.profiling.tabs.rpmTitle', {
        defaultMessage: 'RPM Package',
      }),
      steps: [
        {
          title: i18n.translate('xpack.profiling.tabs.rpmConfigureRepoStep', {
            defaultMessage: 'Configure the yum repository (requires root privileges):',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`sudo rpm --import https://packages.elastic.co/GPG-KEY-elasticsearch
cat <<EOF > /etc/yum.repos.d/elastic.repo
[elastic-${majorVersion}.x]
name=Elastic repository for ${majorVersion}.x packages
baseurl=https://artifacts.elastic.co/packages/${majorVersion}.x/yum
gpgcheck=1
gpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch
enabled=1
autorefresh=1
type=rpm-md
EOF`}
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.rpmInstallPackageStep', {
            defaultMessage: 'Install the RPM package (requires root privileges):',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`sudo yum install pf-host-agent`}
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.rpmEditConfigStep', {
            defaultMessage: 'Edit the configuration (requires root privileges):',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`echo -e "project-id 1\nsecret-token ${secretToken}\ncollection-agent ${collectionAgentHost}" | sudo tee -a /etc/Elastic/universal-profiling/pf-host-agent.conf`}
            </EuiCodeBlock>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.rpmStartSystemdServiceStep', {
            defaultMessage:
              'Start the Universal Profiling systemd service (requires root privileges):',
          }),
          content: (
            <EuiCodeBlock paddingSize="s" isCopyable>
              {`sudo systemctl enable pf-host-agent && sudo systemctl restart pf-host-agent`}
            </EuiCodeBlock>
          ),
        },
      ],
    },
    {
      key: AddDataTabs.ElasticAgentIntegration,
      title: i18n.translate('xpack.profiling.tabs.elasticAgentIntegration.title', {
        defaultMessage: 'Elastic Agent Integration',
      }),
      steps: [
        {
          title: i18n.translate('xpack.profiling.tabs.elasticAgentIntegration.step1', {
            defaultMessage: 'Copy credentials',
          }),
          content: (
            <>
              <EuiText>
                {i18n.translate('xpack.profiling.tabs.elasticAgentIntegration.step1.hint', {
                  defaultMessage:
                    "You'll need these credentials to set up Universal Profiling. Please save them in a secure location, as they will be required in the subsequent step.",
                })}
              </EuiText>
              <EuiSpacer />
              <EuiText style={{ fontWeight: 'bold' }} size="s">
                {i18n.translate('xpack.profiling.tabs.elasticAgentIntegration.step1.secretToken', {
                  defaultMessage: 'Secret token:',
                })}
              </EuiText>
              <EuiCodeBlock paddingSize="s" isCopyable>
                {secretToken}
              </EuiCodeBlock>
              <EuiSpacer size="s" />
              <EuiText style={{ fontWeight: 'bold' }} size="s">
                {i18n.translate(
                  'xpack.profiling.tabs.elasticAgentIntegration.step1.collectionAgentUrl',
                  { defaultMessage: 'Universal Profiling Collector url:' }
                )}
              </EuiText>
              <EuiCodeBlock paddingSize="s" isCopyable>
                {collectionAgentHost}
              </EuiCodeBlock>
            </>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.elasticAgentIntegration.step2', {
            defaultMessage: 'Fleet',
          }),
          content: (
            <EuiButton
              iconType="gear"
              fill
              href={`${core.http.basePath.prepend(
                `/app/integrations/detail/profiler_agent-${data?.profilerAgent.version}/overview`
              )}`}
            >
              {i18n.translate('xpack.profiling.tabs.elasticAgentIntegration.step2.button', {
                defaultMessage: 'Manage Universal Profiling agent in Fleet',
              })}
            </EuiButton>
          ),
        },
      ],
    },
    {
      key: AddDataTabs.Symbols,
      title: i18n.translate('xpack.profiling.tabs.symbols.title', {
        defaultMessage: 'Upload Symbols',
      }),
      steps: [
        {
          title: i18n.translate('xpack.profiling.tabs.symbols.step1', {
            defaultMessage: 'Download and extract symbtool',
          }),
          content: (
            <EuiText>
              <b>For x86_64:</b>
              <EuiSpacer size="s" />
              <EuiCodeBlock paddingSize="s" isCopyable>
                {`wget -O symbtool-amd64.tgz "https://artifacts.elastic.co/downloads/prodfiler/symbtool-${stackVersion}-linux-x86_64.tar.gz" && tar xzf symbtool-amd64.tgz && cd symbtool-*-linux-x86_64`}
              </EuiCodeBlock>
              <EuiSpacer size="m" />
              <b>For ARM64:</b>
              <EuiSpacer size="s" />
              <EuiCodeBlock paddingSize="s" isCopyable>
                {`wget -O symbtool-arm64.tgz "https://artifacts.elastic.co/downloads/prodfiler/pf-host-agent-${stackVersion}-linux-arm64.tar.gz" && tar xzf symbtool-arm64.tgz && cd symbtool-*-linux-arm64`}
              </EuiCodeBlock>
            </EuiText>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.symbols.step2', {
            defaultMessage: 'Generate an Elasticsearch token',
          }),
          content: (
            <EuiText>
              <EuiLink
                target="_blank"
                href={`https://www.elastic.co/guide/en/kibana/master/api-keys.html`}
              >
                {i18n.translate('xpack.profiling.tabs.symbols.step2.instructions', {
                  defaultMessage: 'Instructions here',
                })}
              </EuiLink>
            </EuiText>
          ),
        },
        {
          title: i18n.translate('xpack.profiling.tabs.symbols.step3', {
            defaultMessage: 'Upload symbols',
          }),
          content: (
            <div>
              <EuiCodeBlock paddingSize="s" isCopyable>
                {`./symbtool push-symbols executable -u "${symbolUrl}" -t <ES token> -e <my executable>`}
              </EuiCodeBlock>
              <EuiSpacer size="m" />
              <EuiText>
                <FormattedMessage
                  id="xpack.profiling.tabs.symbols.step3.replace"
                  defaultMessage="Replace {es_token} etc. with the actual values. You can pass {help} to obtain a list of other arguments."
                  values={{
                    es_token: <EuiCode>{`<ES token>`}</EuiCode>,
                    help: <EuiCode>--help</EuiCode>,
                  }}
                />
              </EuiText>
              <EuiSpacer size="s" />
              <EuiText>
                <FormattedMessage
                  id="xpack.profiling.tabs.symbols.step3.doc-ref"
                  defaultMessage="Documentation for more advanced uses cases is available in {link}."
                  values={{
                    link: (
                      <EuiLink
                        target="_blank"
                        href={`https://www.elastic.co/guide/en/observability/current/profiling-add-symbols.html`}
                      >
                        {i18n.translate('xpack.profiling.tabs.symbols.step3.doc-ref.link', {
                          defaultMessage: 'the corresponding documentation page',
                        })}
                      </EuiLink>
                    ),
                  }}
                />
              </EuiText>
            </div>
          ),
        },
      ],
    },
  ];

  const displayedTab = tabs.find((tab) => tab.key === selectedTab)!;

  const displayedSteps = displayedTab.steps ?? [];

  const isLoading = status === AsyncStatus.Loading;

  return (
    <ProfilingAppPageTemplate
      tabs={[]}
      restrictWidth
      hideSearchBar
      pageTitle={
        <EuiFlexGroup direction="row" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiIcon type="logoObservability" size="m" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {i18n.translate('xpack.profiling.noDataPage.pageTitle', {
              defaultMessage: 'Add profiling data',
            })}
          </EuiFlexItem>
          {isLoading ? (
            <EuiFlexItem>
              <EuiLoadingSpinner />
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      }
    >
      {isLoading ? (
        <></>
      ) : (
        <>
          <EuiCallOut
            color="warning"
            iconType="help"
            title={
              <FormattedMessage
                id="xpack.profiling.tabs.debWarning"
                defaultMessage="Due to a {linuxLink}, we have stopped host-agents on kernel versions {versionFrom} to {versionTo}. Refer to {debianLink} and {fedoraLink} to learn more."
                values={{
                  versionFrom: <strong>5.19</strong>,
                  versionTo: <strong>6.4</strong>,
                  linuxLink: (
                    <EuiLink
                      target="_blank"
                      href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d319f344561de23e810515d109c7278919bff7b0"
                    >
                      {i18n.translate('xpack.profiling.tabs.debWarning.linuxLink', {
                        defaultMessage: 'Linux kernel bug',
                      })}
                    </EuiLink>
                  ),
                  debianLink: (
                    <EuiLink
                      target="_blank"
                      href="https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1033398"
                    >
                      {i18n.translate('xpack.profiling.tabs.debWarning.debianLink', {
                        defaultMessage: 'Debian',
                      })}
                    </EuiLink>
                  ),
                  fedoraLink: (
                    <EuiLink
                      target="_blank"
                      href="https://bugzilla.redhat.com/show_bug.cgi?id=2211455"
                    >
                      {i18n.translate('xpack.profiling.tabs.debWarning.fedoraLink', {
                        defaultMessage: 'Fedora/CentOS',
                      })}
                    </EuiLink>
                  ),
                }}
              />
            }
          />
          <EuiSpacer />
          <EuiText>
            {i18n.translate('xpack.profiling.noDataPage.addDataTitle', {
              defaultMessage: 'Select an option below to deploy the host-agent.',
            })}
          </EuiText>
          <EuiSpacer />
          <EuiSplitPanel.Outer>
            <EuiPanel hasBorder={false} hasShadow={false} grow={false} paddingSize="none">
              <EuiSplitPanel.Inner color="subdued" paddingSize="none">
                <EuiTabs style={{ padding: '0 24px' }}>
                  {tabs.map((tab) => {
                    return (
                      <EuiTab
                        key={tab.key}
                        onClick={() => {
                          profilingRouter.push(routePath, {
                            path: {},
                            query: { selectedTab: tab.key },
                          });
                        }}
                        isSelected={tab.key === selectedTab}
                      >
                        {tab.title}
                      </EuiTab>
                    );
                  })}
                </EuiTabs>
              </EuiSplitPanel.Inner>
              <EuiSplitPanel.Inner style={{ padding: '0 24px' }}>
                <EuiSpacer size="xxl" />
                <EuiSteps
                  steps={displayedSteps.map((step) => {
                    return {
                      title: step.title,
                      children: step.content,
                      status: 'incomplete',
                    };
                  })}
                />
              </EuiSplitPanel.Inner>
            </EuiPanel>
          </EuiSplitPanel.Outer>
        </>
      )}
    </ProfilingAppPageTemplate>
  );
}
