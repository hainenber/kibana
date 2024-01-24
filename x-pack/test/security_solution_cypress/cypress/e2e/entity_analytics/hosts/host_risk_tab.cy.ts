/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  navigateToHostRiskDetailTab,
  openRiskTableFilterAndSelectTheCriticalOption,
  removeCriticalFilterAndCloseRiskTableFilter,
  selectFiveItemsPerPageOption,
} from '../../../tasks/host_risk';
import {
  HOST_BY_RISK_TABLE_CELL,
  HOST_BY_RISK_TABLE_HOSTNAME_CELL,
  HOST_BY_RISK_TABLE_NEXT_PAGE_BUTTON,
} from '../../../screens/hosts/host_risk';
import { login } from '../../../tasks/login';
import { visitWithTimeRange } from '../../../tasks/navigation';
import { hostsUrl } from '../../../urls/navigation';
import { kqlSearch } from '../../../tasks/security_header';
import { mockRiskEngineEnabled } from '../../../tasks/entity_analytics';

describe('risk tab', { tags: ['@ess', '@serverless'] }, () => {
  // FLAKY: https://github.com/elastic/kibana/issues/174859
  describe.skip('with legacy risk score', () => {
    before(() => {
      cy.task('esArchiverLoad', { archiveName: 'risk_hosts' });
    });

    beforeEach(() => {
      login();
      visitWithTimeRange(hostsUrl('allHosts'));
      // by some reason after navigate to host risk, page is sometimes is reload or go to all host tab
      // this fix wait until we fave host in all host table, and then we go to risk tab
      cy.contains('siem-kibana');

      // Sometimes it doesn't navigate to the risk tab an causes flakiness
      // Curiously the "renders the table" test doesn't fail
      // https://github.com/elastic/kibana/issues/174860
      // https://github.com/elastic/kibana/issues/174859
      navigateToHostRiskDetailTab();
    });

    after(() => {
      cy.task('esArchiverUnload', 'risk_hosts');
    });

    it('renders the table', () => {
      kqlSearch('host.name: "siem-kibana" {enter}');
      cy.get(HOST_BY_RISK_TABLE_CELL).eq(4).should('have.text', 'siem-kibana');
      cy.get(HOST_BY_RISK_TABLE_CELL).eq(5).should('have.text', 'Mar 10, 2021 @ 14:51:05.766');
      cy.get(HOST_BY_RISK_TABLE_CELL).eq(6).should('have.text', '21');
      cy.get(HOST_BY_RISK_TABLE_CELL).eq(7).should('have.text', 'Low');
    });

    // Flaky
    it.skip('filters the table', () => {
      openRiskTableFilterAndSelectTheCriticalOption();

      cy.get(HOST_BY_RISK_TABLE_CELL).eq(3).should('not.have.text', 'siem-kibana');

      removeCriticalFilterAndCloseRiskTableFilter();
    });

    // Flaky
    it.skip('should be able to change items count per page', () => {
      selectFiveItemsPerPageOption();

      cy.get(HOST_BY_RISK_TABLE_HOSTNAME_CELL).should('have.length', 5);
    });

    it('should not allow page change when page is empty', () => {
      kqlSearch('host.name: "nonexistent_host" {enter}');
      cy.get(HOST_BY_RISK_TABLE_NEXT_PAGE_BUTTON).should(`not.exist`);
    });
  });

  describe('with new risk score', () => {
    before(() => {
      cy.task('esArchiverLoad', { archiveName: 'risk_scores_new' });
    });

    beforeEach(() => {
      login();
      mockRiskEngineEnabled();
      visitWithTimeRange(hostsUrl('allHosts'));
      // by some reason after navigate to host risk, page is sometimes is reload or go to all host tab
      // this fix wait until we fave host in all host table, and then we go to risk tab
      cy.contains('siem-kibana');
      navigateToHostRiskDetailTab();
    });

    after(() => {
      cy.task('esArchiverUnload', 'risk_scores_new');
    });

    it('renders the table', () => {
      kqlSearch('host.name: "siem-kibana" {enter}');
      cy.get(HOST_BY_RISK_TABLE_CELL).eq(4).should('have.text', 'siem-kibana');
      cy.get(HOST_BY_RISK_TABLE_CELL).eq(5).should('have.text', 'Mar 10, 2021 @ 14:51:05.766');
      cy.get(HOST_BY_RISK_TABLE_CELL).eq(6).should('have.text', '90');
      cy.get(HOST_BY_RISK_TABLE_CELL).eq(7).should('have.text', 'Critical');
    });

    // Flaky
    it.skip('filters the table', () => {
      openRiskTableFilterAndSelectTheCriticalOption();

      cy.get(HOST_BY_RISK_TABLE_CELL).eq(3).should('not.have.text', 'siem-kibana');

      removeCriticalFilterAndCloseRiskTableFilter();
    });

    // Flaky
    it.skip('should be able to change items count per page', () => {
      selectFiveItemsPerPageOption();

      cy.get(HOST_BY_RISK_TABLE_HOSTNAME_CELL).should('have.length', 5);
    });

    it('should not allow page change when page is empty', () => {
      kqlSearch('host.name: "nonexistent_host" {enter}');
      cy.get(HOST_BY_RISK_TABLE_NEXT_PAGE_BUTTON).should(`not.exist`);
    });
  });
});
