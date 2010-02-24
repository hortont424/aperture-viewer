#!/usr/bin/perl

use Path::Class;
use Storable;
use File::Find;
use Mac::PropertyList qw( :all );

my $ap_path = "/srv/share/public/Photos/Aperture\ Library.aplibrary/";
my %ap_library;

find(\&wanted, $ap_path);
sub wanted
{
    if(/Version-1\.apversion/)
    {
        my $plist = parse_plist_file($File::Find::name)->as_perl;
        my $keywords = $plist->{'keywords'};
        my @keyword_list = @$keywords;
        my $imageDate = $plist->{'imageDate'};
        my $uuid = $plist->{'uuid'};
        
        my $preview_name = $File::Find::name;
        $preview_name =~ s/Database\/Versions/Previews/;
        $preview_name =~ s/\/[^\/]*\/Version-1.apversion//;
        $preview_name .= "/" . $uuid . "/";
        
        $preview_image_name = "";
        
        find(\&wanted_image, $preview_name);
        
        sub wanted_image
        {
            if(/jpg$/ && !/^thumb_/)
            {
                $preview_image_name = $File::Find::name;
            }
        }
        
        if(!grep(/nsfi/,@keyword_list) && $preview_image_name ne "")
        {
            foreach $kw (@keyword_list)
            {
                push @{ $ap_library{$kw} }, "${imageDate}~~${preview_image_name}";
            }
        }
    }
}

print "\n\n\n Keys:\n";
print keys %ap_library;

store (\%ap_library, "/srv/share/www/aperture/apoutput.lib");

my %ap_lib_counts;
foreach $key (sort keys %ap_library)
{
   if($key ne "untaggable")
   {
      foreach $kw (sort keys %ap_library)
      {
         my %union = my %isect = ();
         foreach $e (@{ $ap_library{$kw} }, @{ $ap_library{$key} }) { $union{$e}++ && $isect{$e}++ }
         my @littlelist = keys %isect;
         if($#littlelist > -1)
         {
            push(@{$ap_lib_counts{$key}}, $kw);
         }
      }
   }
}

store (\%ap_lib_counts, "/srv/share/www/aperture/apoutput-counts.lib");
