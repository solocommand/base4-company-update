import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'cuf/gql/queries/company';

export default Route.extend(RouteQueryManager, {
  model({ hash }) {
    const variables = { input: { hash } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'cache-and-network' }, 'contentHash');
  },
  afterModel(model) {
    const sectionIds = model.get('websiteSchedules').map(({ section }) => section.id);
    model.set('sectionIds', sectionIds);
  },
});
