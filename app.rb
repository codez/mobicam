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

CHUNK_SIZE = 65536
UPLOAD_DIR = ENV['UPLOAD_DIR'] || './uploads'
FileUtils.mkdir_p(UPLOAD_DIR)

### ROUTES

get '/' do
  @color_from, @color_to = random_gradient
  haml :index
end

post '/' do
  if params[:upload] && params[:upload][:tempfile]
    copy_file(params[:upload][:tempfile], params[:upload][:filename])
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
  def copy_file(stream, filename)
    filename = Time.now.strftime('%Y%m%d%H%M%S') + normalized_extension(filename)
    tempfile = File.join(Dir.tmpdir, filename)
    write_file(stream, tempfile)
    FileUtils.mv(tempfile, File.join(UPLOAD_DIR, filename))
    201
  rescue => e
    logger.error(e)
    [500, e.message]
  end

  def write_file(stream, tempfile)
    File.open(tempfile, 'wb') do |f|
      while chunk = stream.read(CHUNK_SIZE)
        f.write(chunk)
      end
    end
  end

  def normalized_extension(filename)
    extension = File.extname(filename).downcase
    extension == '.jpeg' ? '.jpg' : extension
  end

  def random_gradient
    file = File.join(File.dirname(__FILE__), 'resources', 'gradients.json')
    gradients = JSON.parse(File.read(file))
    gradients.sample.fetch('colors')
  end
end
