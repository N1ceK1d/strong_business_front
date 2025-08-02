<template>
  <component :is="currentTestComponent" :test-id="testId" />
</template>

<script>
import IQTest from './test_results/IQTest.vue';
import TestOCA from './test_results/TestOCA.vue';
import TestMotivation from './test_results/TestMotivation.vue';
import TestPotential from './test_results/TestPotential.vue';
import ToneScale from './test_results/ToneScale.vue';

export default {
  name: 'TestResults',
  components: {
    IQTest,
    TestOCA,
    TestMotivation,
    TestPotential,
    ToneScale
  },
  props: {
    test_id: {
      type: [String, Number],
      required: true
    }
  },
  computed: {
    testId() {
      return parseInt(this.test_id);
    },
    currentTestComponent() {
      const testComponents = {
        1: 'TestPotential',
        2: 'TestMotivation',
        3: 'IQTest',
        4: 'TestOCA',
        5: 'ToneScale'
      };
      
      return testComponents[this.testId] || 'TestPotential'; // Компонент по умолчанию
    }
  }
};
</script>