#!/usr/bin/env ruby

require 'rubygems'
require 'bundler'
require 'fileutils'
require 'tmpdir'

Bundler.require
require 'dotenv/load'

### SETUP

set :bind, '0.0.0.0'
set :server, :puma
set :haml, format: :html5

UPLOAD_DIR = ENV['UPLOAD_DIR'] || './uploads'
FileUtils.mkdir_p(UPLOAD_DIR)

### ROUTES

get '/' do
  @color_from, @color_to = random_gradient
  haml :index
end

post '/' do
  if params[:upload] && params[:upload][:tempfile]
    copy_file(params[:upload][:tempfile], File.extname(params[:upload][:filename]))
  else
    haml :index
  end
end

get '/uploads' do
  JSON.dump({ uploads: Dir.children(UPLOAD_DIR).sort })
end

get '/uploads/:name.:ext' do
  send_file(File.join(UPLOAD_DIR, "#{params[:name]}.#{params[:ext]}"))
end

### HELPERS

helpers do
  def copy_file(stream, extension)
    filename = Time.now.strftime('%Y%m%d%H%M%S') + extension
    tempfile = File.join(Dir.tmpdir, filename)
    File.open(tempfile, 'wb') do |f|
      while chunk = stream.read(65536)
        f.write(chunk)
      end
    end
    FileUtils.mv(tempfile, File.join(UPLOAD_DIR, filename))
    201
  rescue => e
    logger.error(e)
    [500, e.message]
  end

  def random_gradient
    file = File.join(File.dirname(__FILE__), 'resources', 'gradients.json')
    json = JSON.parse(File.read(file))
    json.sample.fetch('colors')
  end
end
