#!/usr/bin/perl

use Path::Class;
use Storable;

my $ap_path = "/srv/share/public/Photos/Aperture\ Library.aplibrary/";
my %ap_library;

open(APLIB, "<${ap_path}ApertureData.xml");

while(<APLIB>)
{
	#if(/<string>(.*aplibrary.*Previews.*)<\/string>/)
	if(/<string>(.*aplibrary.*Thumbnails.*)<\/string>/)
	{
		my $fixurl = $1;

		$fixurl =~ s/\/Users\/hortont\/Pictures//;
		$fixurl = "/srv/share/public/Photos" . $fixurl;

		my $backup = $fixurl;
		my $dirname = $fixurl;
		my $dir = dir($dirname)->parent->parent;
		$dirname = "$dir";
		$dirname =~ s/&apos;/\'/g;
		$dirname =~ s/&amp;/&/g;
		my $keywords = `grep -r -A 1 "Keywords" \"$dirname\"/Version-*.apversion`;
		$keywords =~ /\<string\>([^\<]*)\</;
		@keyword_list = split(", ", $1);
		
		my $imageDate = `grep -r -A 1 "ImageDate" \"$dirname\"/Version-*.apversion`;
		$imageDate =~ /\<date\>([^\<]*)\</;
		$imageDate = $1;
		
		#$keywords =~ s/^.*\<key\>.*$/$1/;
		#$keywords =~ s/\n//g;
		
		
		
		if(!grep(/nsfi/,@keyword_list))
		{
			foreach $kw (@keyword_list)
			{
				#print $kw . ", ";
				push @{ $ap_library{$kw} }, "${imageDate}~~${backup}";
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
