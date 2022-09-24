import test from 'japa'

test.group('Examples', () => {
  test('assert sum', (assert) => {
    assert.equal(2 + 2, 4)
  })
})
