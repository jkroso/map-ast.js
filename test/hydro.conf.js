/**
 * Hydro configuration
 *
 * @param {Hydro} hydro
 */

module.exports = function(hydro) {
  hydro.set({
    timeout: 500,
    'fail-fast': true,
    plugins: [
      require('hydro-bdd'),
      require('hydro-fail-fast')
    ]
  })
}
