fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Push a new beta build to TestFlight

### ios release

```sh
[bundle exec] fastlane ios release
```

Build for release (App Store submission)

### ios build_only

```sh
[bundle exec] fastlane ios build_only
```

Build the app without uploading

### ios sync_certificates

```sh
[bundle exec] fastlane ios sync_certificates
```

Download certificates and provisioning profiles

### ios register_devices

```sh
[bundle exec] fastlane ios register_devices
```

Register new devices for ad-hoc distribution

### ios screenshots

```sh
[bundle exec] fastlane ios screenshots
```

Capture screenshots for App Store

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
