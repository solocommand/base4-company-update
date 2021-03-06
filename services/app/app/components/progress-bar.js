import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'span',
  classNames: ['progress'],
  classNameBindings: ['show:d-block:d-none'],
  show: false,
  showLabel: true,
  value: 0,
});
