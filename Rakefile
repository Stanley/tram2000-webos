require 'rake'

desc 'Default: run application'
task :default => :run

desc 'Launch emulator'
task :emulator do
  sh "sudo /etc/init.d/vboxdrv setup && sudo modprobe -r kvm_intel && palm-emulator --start='Palm SDK 1.3.1.314 (320x480)'"
end

desc 'Package, install & launch'
task :run do
  sh "palm-package . -o packages && palm-install packages/* && palm-launch net.wasiutynski.tram2000"
end

desc 'Run tests'
task :tests do
  sh "palm-package . -o packages && palm-install packages/* && palm-launch -p '{mojoTest:true}' net.wasiutynski.tram2000"
end