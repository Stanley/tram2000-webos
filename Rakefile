require 'rake'

desc 'Default: run application'
task :default => 'run:default'


namespace :emulator do
  desc 'Setup vbox and launch emulator'
  task :setup do
    sh "sudo /etc/init.d/vboxdrv setup && sudo modprobe -r kvm_intel"
  end

  desc 'Just launch emulator'
  task :default do
    sh "palm-emulator --start='SDK 1.4.1.427 (320x480)'"
  end
end

namespace :run do
  desc 'Package, install & launch'
  task :default do
    sh "palm-package . -o ../packages && palm-install ../packages/net.wasiutynski.tram2000_0.1.0_all.ipk && palm-launch net.wasiutynski.tram2000"
  end

  desc 'Package, install & launch on emulator'
  task :tcp do
    sh "palm-package . -o ../packages && palm-install ../packages/net.wasiutynski.tram2000_0.1.0_all.ipk -d tcp && palm-launch net.wasiutynski.tram2000 -d tcp"
  end
end

desc 'Run tests'
task :tests do
  sh "palm-package . -o packages && palm-install packages/* && palm-launch -p '{mojoTest:true}' net.wasiutynski.tram2000"
end

desc 'Root emulator'
task :ssh do
  p "To start autodrive type: luna-send -n 1 luna://com.palm.pmradiosimulator/autodrive/start {}"
  sh "/opt/Palm/novacom/novacom -t open tty://"
end

namespace :log do
  desc 'Display logs and follow the output'
  task :default do
    # palm-log --system-log-level info
    sh "clear && palm-log --follow net.wasiutynski.tram2000"
  end

  desc 'Display logs from emulator and follow the output'
  task :tcp do
    # palm-log --system-log-level info
    sh "clear && palm-log --follow net.wasiutynski.tram2000 -d tcp"
  end
end