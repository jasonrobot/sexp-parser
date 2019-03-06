require "./spec_helper"

include SExpressionParser

describe SExpressionParser do
  # TODO: Write tests

  describe "endOfSymbol?" do
    it "should be true for )" do
      endOfSymbol?(')').should eq true
    end

    # it "should be true for \"\"" do
    #   endOfSymbol?("").should eq true
    # end

    it "should be true for \" \"" do
      endOfSymbol?(' ').should eq true
    end
  end

  describe "chompWhitespace!" do
    it "should go to 1 for \" a\"" do
      chompWhitespace(" a", 0).should eq 1
    end

    it "should stay at 0 for \"a\"" do
      chompWhitespace("a", 0).should eq 0
    end

    it "shouldnt fuck around" do
      chompWhitespace("(1 (2 3) 4)", 2).should eq 3
      chompWhitespace("(1 (2 3) 4)", 5).should eq 6
    end
  end

  describe "parseBool" do
    it "should parse true for \"T\"" do
      parseBool("T").should eq true
    end

    it "should parse false for \"NIL\"" do
      parseBool("NIL").should eq false
    end

    it "should parse nil for a number" do
      parseBool("69").should eq nil
    end
  end

  describe "parseString" do
    it "should parse a plain string" do
      parseString("\"asdf\"").should eq "asdf"
    end


  end

  describe "parseSymbol" do
    it "should parse :foo as :foo" do
      parseSymbol(":foo").should eq ":foo"
    end

    # it "should not trip on trailing paren" do
    #   parseSymbol(":bar)").should eq ":bar"
    # end

    it "should preserve case" do
      parseSymbol(":cAsEsEnSiTiVe").should eq ":cAsEsEnSiTiVe"
    end
  end

  describe "parseNumber" do
    it "should parse any valid float" do
      parseNumber("12").should eq 12

      parseNumber("-1").should eq -1

      parseNumber("0.5").should eq 0.5

      parseNumber("-.1").should eq -0.1
    end
  end

  xdescribe "parseSexp" do
    it "should parse a list" do
      parseSexp("(1 2 3)").should eq [1, 2, 3]
    end

    it "should parse empty list" do
      parseSexp("()").should eq [] of Result
    end

    describe "nested expressions" do

      it "should parse nested lists" do
        parseSexp("(1 (2 3) 4)").should eq [1, [2, 3], 4]
      end

      # it "should parse nested empty lists" do
      #   parseSexp("(())").should eq [[] of Result] of Result
      #   parseSexp("( ( ) )").should eq [[] of Result] of Result
      # end

    end

  end

end
