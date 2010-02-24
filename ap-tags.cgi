#!/usr/bin/perl

use Storable;
use CGI::Compress::Gzip;
use JSON;

my $cgi = new CGI::Compress::Gzip;

$CGI::Compress::Gzip::global_give_reason = 1;

print $cgi->header();

my %ap_library = ();
%ap_library = %{retrieve('apoutput.lib')};

#print join("\n",@{$ap_library{"dj"}});

################################################
# Return a list of all tags, paired with sizes #
################################################

if(defined($cgi->param("tags")))
{
    my %ap_lib_counts;
    foreach $key (sort keys %ap_library)
    {
        if($key ne "untaggable")
        {
            $ap_lib_counts{$key}+=scalar(@{ $ap_library{$key} });
        }
    }
    print encode_json(\%ap_lib_counts);
}

###################################################
# Return a list of all tags, mapped to all images #
###################################################

if(defined($cgi->param("raw")))
{
    print encode_json(\%ap_library);
}

##############################################################
# Return a list of all tags, mapped to all intersecting tags #
##############################################################

if(defined($cgi->param("counts")))
{
    my %ap_lib_counts = %{retrieve('apoutput-counts.lib')};
    print encode_json(\%ap_lib_counts);
}

#####################################################
# Return a list of all pictures, mapped to all tags #
#####################################################

if(defined($cgi->param("pictures")))
{
    my %ap_lib_pictures;

    foreach my $key (keys %ap_library)
    {
        if($key ne "untaggable")
        {
            foreach my $picture (@{$ap_library{$key}})
            {
                push(@{ $ap_lib_pictures{$picture} }, $key);
            }
        }
    }

    print encode_json(\%ap_lib_pictures);
}

###################################################
# Display the pictures for the given set of tags! #
###################################################

if(defined($cgi->param("pictureTags")))
{
    my @keywords = $cgi->param('pictureTags');

    if(grep(/,/,@keywords)) { @keywords = split(",",$keywords[0]); }

    @biglist = @{ $ap_library{lc($keywords[0])} };
    my $oldkw = shift(@keywords);

    foreach $kw (@keywords)
    {
        $kw = lc($kw);
        my %union = my %isect = ();
        foreach $e (@{ $ap_library{$kw} }, @biglist) { $union{$e}++ && $isect{$e}++ }
        @biglist = keys %isect;
    }

    my $imageCount = 0;

    print <<END;
    <ul class='gallery'>\n<li>
END

    foreach $pic (reverse sort @biglist)
    {
        #$pic =~ s/&apos;/'/g;

        my $preview = $pic;
        $preview =~ s/^(.*)~~(.*)$/$2/;
        $preview =~ s/Thumbnails/Previews/; # WRONG
        $preview =~ s/\/srv\/share\/public\///;
        $preview =~ s/(["'])/\\$1/g;
        $preview =~ s/%/%25/g;
        $pic =~ s/\/srv\/share\/public\///;
        $pic =~ s/^(.*)~~(.*)$/$2/;
        $pic =~ s/%/%25/g;

        print <<END;
        <a class="zoom" href='/$preview'><img src="/$pic" width="100%"/></a>
        </li><li>
END

        $imageCount++;
    }

    print <<END;
    </li>\n</ul>
END

}
