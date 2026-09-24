Pod::Spec.new do |s|
  s.name           = 'Sleep'
  s.version        = '1.0.0'
  s.summary        = 'Reads sleep from Apple Health.'
  s.description    = 'Reads sleep analysis samples from HealthKit for Imara Afya.'
  s.license        = 'UNLICENSED'
  s.author         = 'Imara Co'
  s.homepage       = 'https://imaraco.ltd'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'HealthKit'

  s.source_files = "**/*.{h,m,swift}"
end
