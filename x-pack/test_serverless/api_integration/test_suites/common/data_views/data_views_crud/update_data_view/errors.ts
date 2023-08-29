/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import type { FtrProviderContext } from '../../../../../ftr_provider_context';
import { configArray } from '../../constants';

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');
  const svlCommonApi = getService('svlCommonApi');

  describe('errors', () => {
    configArray.forEach((config) => {
      describe(config.name, () => {
        it('returns error when index_pattern object is not provided', async () => {
          const response = await supertest
            .post(`${config.path}/foo`)
            // TODO: API requests in Serverless require internal request headers
            .set(svlCommonApi.getInternalRequestHeader());

          expect(response.status).to.be(400);
          expect(response.body.statusCode).to.be(400);
          expect(response.body.message).to.be(
            '[request body]: expected a plain object value, but found [null] instead.'
          );
        });

        it('returns error on non-existing index_pattern', async () => {
          const response = await supertest
            .post(`${config.path}/non-existing-index-pattern`)
            // TODO: API requests in Serverless require internal request headers
            .set(svlCommonApi.getInternalRequestHeader())
            .send({
              [config.serviceKey]: {},
            });

          expect(response.status).to.be(404);
          expect(response.body.statusCode).to.be(404);
          expect(response.body.message).to.be(
            'Saved object [index-pattern/non-existing-index-pattern] not found'
          );
        });

        it('returns error when "refresh_fields" parameter is not a boolean', async () => {
          const response = await supertest
            .post(`${config.path}/foo`)
            // TODO: API requests in Serverless require internal request headers
            .set(svlCommonApi.getInternalRequestHeader())
            .send({
              refresh_fields: 123,
              [config.serviceKey]: {
                title: 'foo',
              },
            });

          expect(response.status).to.be(400);
          expect(response.body.statusCode).to.be(400);
          expect(response.body.message).to.be(
            '[request body.refresh_fields]: expected value of type [boolean] but got [number]'
          );
        });

        it('returns success when update patch is empty', async () => {
          const title1 = `foo-${Date.now()}-${Math.random()}*`;
          const response = await supertest
            .post(config.path)
            // TODO: API requests in Serverless require internal request headers
            .set(svlCommonApi.getInternalRequestHeader())
            .send({
              [config.serviceKey]: {
                title: title1,
              },
            });
          const id = response.body[config.serviceKey].id;
          const response2 = await supertest
            .post(`${config.path}/${id}`)
            // TODO: API requests in Serverless require internal request headers
            .set(svlCommonApi.getInternalRequestHeader())
            .send({
              [config.serviceKey]: {},
            });

          expect(response2.status).to.be(200);
        });
      });
    });
  });
}
