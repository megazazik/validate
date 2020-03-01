# [0.7.0](https://github.com/megazazik/validate/compare/v0.6.0...v0.7.0) (2020-03-01)


### Features

* add meta info, add getRules method, add second form of rules method, rename error to data ([88fc526](https://github.com/megazazik/validate/commit/88fc52690fc8a6a1cae57e83194141eb46c7ea73))


### BREAKING CHANGES

* rename error field to data in validation result



# [0.6.0](https://github.com/megazazik/validate/compare/v0.5.0...v0.6.0) (2019-12-24)


### Features

* place each error to separate property ([346d5b2](https://github.com/megazazik/validate/commit/346d5b2a8050067bf05763ec7827f30446985aca))


### BREAKING CHANGES

* Your code probably should still work because validation results have the same
errors field. But if you use tests, they may fail because of new fields in the validation results



# [0.5.0](https://github.com/megazazik/validate/compare/v0.4.1...v0.5.0) (2019-12-23)


### Features

* remove fullObjectRules method ([688f559](https://github.com/megazazik/validate/commit/688f559d208117896241ccf5c66a213c6d97a618))


### BREAKING CHANGES

* fullObjectRules method was removed. Use rules method instead



## [0.4.1](https://github.com/megazazik/validate/compare/v0.4.0...v0.4.1) (2019-12-23)


### Bug Fixes

* **index:** fix types ([4b6ea95](https://github.com/megazazik/validate/commit/4b6ea95f90b485da21923bd2d2c84997369a2707))



# [0.4.0](https://github.com/megazazik/validate/compare/v0.3.2...v0.4.0) (2019-12-19)


### improvement

* move errors to errors field of validation result ([36c7b4b](https://github.com/megazazik/validate/commit/36c7b4b147f5d031de092e01149611becc7c6f93)), closes [#1](https://github.com/megazazik/validate/issues/1)


### BREAKING CHANGES

* A validation result is not an object now. It has an errors field instead



## [0.3.2](https://github.com/megazazik/validate/compare/v0.3.1...v0.3.2) (2019-12-05)


### Bug Fixes

* **types:** fix types declarations ([b2893ed](https://github.com/megazazik/validate/commit/b2893ed09273ce3f64979072b5fdf0402017e24d))



## [0.3.1](https://github.com/megazazik/validate/compare/v0.3.0...v0.3.1) (2019-11-10)



# [0.3.0](https://github.com/megazazik/validate/compare/v0.2.0...v0.3.0) (2019-11-10)


### Features

* rules should return false, null or undefined if data is correct ([a693c2c](https://github.com/megazazik/validate/commit/a693c2cab92166e60c1cc66533020a15472df558))


### BREAKING CHANGES

* Now any falsy values returned by rules except false, null, undefined are errors



# [0.2.0](https://github.com/megazazik/validate/compare/v0.1.2...v0.2.0) (2019-10-13)


### Features

* add property rules via rules method without nested schemes ([553c42b](https://github.com/megazazik/validate/commit/553c42b6fcec89b2601e01ff58aacae102c48fd7))



## [0.1.2](https://github.com/megazazik/validate/compare/v0.1.1...v0.1.2) (2019-10-13)


### Bug Fixes

* **index:** fix result type ([04ba271](https://github.com/megazazik/validate/commit/04ba2713545995a5d9ec51e0825703af488623e7))



## [0.1.1](https://github.com/megazazik/validate/compare/v0.1.0...v0.1.1) (2019-10-13)


### Features

* rename package ([7bb8da1](https://github.com/megazazik/validate/commit/7bb8da14b1f70bab0c09f65faa56c6e31bcd60dd))



# [0.1.0](https://github.com/megazazik/validate/compare/9fb6efe15763c94d813d8a37cc9d31e6585964a9...v0.1.0) (2019-10-13)


### Bug Fixes

* **package.json:** add module field, add types field ([82662e0](https://github.com/megazazik/validate/commit/82662e0e6ed51cbb333b69de9edb298e5644c7b7))
* filter empty results in map function, add docs ([18ce317](https://github.com/megazazik/validate/commit/18ce3174b324221ea88f6e957f9ae08f5203de60))


### Features

* **index:** add common code ([9fb6efe](https://github.com/megazazik/validate/commit/9fb6efe15763c94d813d8a37cc9d31e6585964a9))



